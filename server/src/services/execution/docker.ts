import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Language } from '../../models/Problem';
import { ExecutionProvider, ExecutionUnavailableError, RunLimits, RunResult } from './types';

interface LanguageSpec {
  image: string;
  file: string;
  compile?: string;
  run: string;
}

const SPECS: Record<Language, LanguageSpec> = {
  javascript: { image: 'node:20-alpine', file: 'main.js', run: 'node main.js' },
  python: { image: 'python:3.12-alpine', file: 'main.py', run: 'python3 main.py' },
  c: { image: 'gcc:13', file: 'main.c', compile: 'gcc -O2 -o main main.c -lm', run: './main' },
  cpp: { image: 'gcc:13', file: 'main.cpp', compile: 'g++ -O2 -std=c++17 -o main main.cpp', run: './main' },
  java: { image: 'eclipse-temurin:17-jdk-alpine', file: 'Main.java', compile: 'javac Main.java', run: 'java -Xss64m Main' },
};

const MAX_OUTPUT_BYTES = 64 * 1024;
/** Container start-up overhead we don't charge to the user's time limit. */
const STARTUP_ALLOWANCE_MS = 1500;
const COMPILE_TIMEOUT_MS = 20_000;

interface ContainerResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  timeMs: number;
}

/**
 * Runs code in throwaway Docker containers with no network, a read-only root
 * filesystem, dropped capabilities, an unprivileged user, and CPU/memory/PID limits.
 * Requires the Docker CLI on the host (self-hosted deployments only).
 */
export class DockerProvider implements ExecutionProvider {
  readonly name = 'docker';

  private runContainer(
    spec: LanguageSpec,
    workDir: string,
    command: string,
    stdin: string,
    timeoutMs: number,
    memoryMb: number,
    writable: boolean
  ): Promise<ContainerResult> {
    const name = `algoarena-${crypto.randomUUID()}`;
    const args = [
      'run', '--rm', '-i', '--name', name,
      '--network', 'none',
      '--memory', `${memoryMb}m`, '--memory-swap', `${memoryMb}m`,
      '--cpus', '1', '--pids-limit', '64',
      '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
      '--read-only', '--tmpfs', '/tmp:rw,size=16m',
      '--user', '65534:65534',
      '-v', `${workDir}:/code:${writable ? 'rw' : 'ro'}`,
      '-w', '/code',
      spec.image, 'sh', '-c', command,
    ];

    return new Promise((resolve, reject) => {
      const started = Date.now();
      const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const append = (current: string, chunk: Buffer) =>
        current.length >= MAX_OUTPUT_BYTES ? current : (current + chunk.toString('utf8')).slice(0, MAX_OUTPUT_BYTES);

      child.stdout.on('data', (chunk) => (stdout = append(stdout, chunk)));
      child.stderr.on('data', (chunk) => (stderr = append(stderr, chunk)));

      const timer = setTimeout(() => {
        timedOut = true;
        spawn('docker', ['kill', name]).on('error', () => undefined);
        child.kill('SIGKILL');
      }, timeoutMs + STARTUP_ALLOWANCE_MS);

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(new ExecutionUnavailableError(`Docker is not available: ${error.message}`));
      });
      child.on('close', (exitCode) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode, timedOut, timeMs: Math.max(0, Date.now() - started - 300) });
      });

      child.stdin.on('error', () => undefined);
      child.stdin.end(stdin);
    });
  }

  async run(code: string, language: Language, stdin: string, limits: RunLimits): Promise<RunResult> {
    const spec = SPECS[language];
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algoarena-'));
    try {
      fs.chmodSync(workDir, 0o777);
      fs.writeFileSync(path.join(workDir, spec.file), code);

      if (spec.compile) {
        const compiled = await this.runContainer(spec, workDir, spec.compile, '', COMPILE_TIMEOUT_MS, 512, true);
        if (compiled.exitCode !== 0) {
          return {
            status: 'compile_error',
            stdout: '',
            stderr: compiled.timedOut ? 'Compilation timed out' : compiled.stderr || compiled.stdout,
            timeMs: 0,
            memoryKb: 0,
          };
        }
      }

      const result = await this.runContainer(
        spec, workDir, spec.run, stdin, limits.timeLimitMs, limits.memoryLimitMb, false
      );
      if (result.exitCode === 125 || result.exitCode === 126 || result.exitCode === 127) {
        throw new ExecutionUnavailableError(`Docker failed to start the sandbox: ${result.stderr.slice(0, 200)}`);
      }
      const status = result.timedOut
        ? 'time_limit_exceeded'
        : result.exitCode === 0
          ? 'ok'
          : 'runtime_error';
      return { status, stdout: result.stdout, stderr: result.stderr, timeMs: result.timeMs, memoryKb: 0 };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}
