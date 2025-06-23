import { ITestCase } from '../models/Problem';
import { ITestResult } from '../models/Submission';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const docker = new Docker();

const LANGUAGE_CONFIGS = {
  javascript: {
    image: 'node:16',
    filename: 'solution.js',
    command: ['node', 'solution.js']
  },
  python: {
    image: 'python:3.9',
    filename: 'solution.py',
    command: ['python', 'solution.py']
  },
  java: {
    image: 'openjdk:11',
    filename: 'Solution.java',
    command: ['java', 'Solution']
  },
  cpp: {
    image: 'gcc:latest',
    filename: 'solution.cpp',
    command: ['./solution']
  }
};

export async function executeCode(
  code: string,
  language: keyof typeof LANGUAGE_CONFIGS,
  testCases: ITestCase[]
): Promise<ITestResult[]> {
  const config = LANGUAGE_CONFIGS[language];
  const results: ITestResult[] = [];

  // Create temporary directory for code files
  const tempDir = path.join(__dirname, '../../temp', uuidv4());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Write code to file
    const codePath = path.join(tempDir, config.filename);
    fs.writeFileSync(codePath, code);

    // Compile code if needed
    if (language === 'cpp') {
      await docker.run(
        config.image,
        ['g++', '-o', 'solution', 'solution.cpp'],
        process.stdout,
        {
          HostConfig: {
            Binds: [`${tempDir}:/app`],
            WorkingDir: '/app'
          }
        }
      );
    } else if (language === 'java') {
      await docker.run(
        config.image,
        ['javac', 'Solution.java'],
        process.stdout,
        {
          HostConfig: {
            Binds: [`${tempDir}:/app`],
            WorkingDir: '/app'
          }
        }
      );
    }

    // Run each test case
    for (const testCase of testCases) {
      const startTime = Date.now();
      let output = '';
      let error = '';
      let memoryUsed = 0;

      try {
        const container = await docker.createContainer({
          Image: config.image,
          Cmd: config.command,
          HostConfig: {
            Binds: [`${tempDir}:/app`],
            WorkingDir: '/app',
            Memory: 512 * 1024 * 1024, // 512MB memory limit
            MemorySwap: -1
          },
          Tty: false
        });

        await container.start();

        // Write input to container
        const stream = await container.attach({
          stream: true,
          stdin: true,
          stdout: true,
          stderr: true
        });

        stream.write(testCase.input + '\n');
        stream.end();

        // Get container output
        const outputStream = await container.logs({
          follow: true,
          stdout: true,
          stderr: true
        });

        output = outputStream.toString().trim();
        const stats = await container.stats({ stream: false });
        memoryUsed = stats.memory_stats.usage || 0;

        await container.stop();
        await container.remove();
      } catch (err) {
        error = (err as Error).message;
      }

      const executionTime = Date.now() - startTime;
      const passed = !error && output.trim() === testCase.output.trim();

      results.push({
        testCase: testCase._id,
        passed,
        output: error || output,
        expectedOutput: testCase.output,
        executionTime,
        memoryUsed
      });
    }
  } finally {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  return results;
} 