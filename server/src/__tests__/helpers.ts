import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { setExecutionProvider } from '../services/execution';
import { ExecutionProvider, RunResult } from '../services/execution/types';

/**
 * Deterministic stand-in for the sandbox. The "source code" is a keyword:
 *   sum   -> prints the sum of the integers on stdin
 *   echo  -> prints stdin back
 *   crash -> runtime error;  loop -> time limit;  broken -> compile error
 */
export const fakeProvider: ExecutionProvider = {
  name: 'fake',
  async run(code, _language, stdin): Promise<RunResult> {
    const base = { stderr: '', timeMs: 5, memoryKb: 1024 };
    switch (code.trim()) {
      case 'sum':
        return { ...base, status: 'ok', stdout: `${stdin.split(/\s+/).filter(Boolean).map(Number).reduce((a, b) => a + b, 0)}\n` };
      case 'echo':
        return { ...base, status: 'ok', stdout: stdin };
      case 'crash':
        return { ...base, status: 'runtime_error', stdout: '', stderr: 'Segmentation fault' };
      case 'loop':
        return { ...base, status: 'time_limit_exceeded', stdout: '' };
      case 'broken':
        return { ...base, status: 'compile_error', stdout: '', stderr: 'error: expected ;' };
      default:
        return { ...base, status: 'ok', stdout: '' };
    }
  },
};

let mongo: MongoMemoryServer;

export const startDb = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  setExecutionProvider(fakeProvider);
};

export const stopDb = async () => {
  await mongoose.disconnect();
  await mongo?.stop();
};
