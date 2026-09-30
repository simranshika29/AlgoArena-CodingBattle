import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';

function required(name: string, fallbackForTest?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isTest && fallbackForTest !== undefined) return fallbackForTest;
  throw new Error(`Missing required environment variable: ${name}`);
}

const jwtSecret = required('JWT_SECRET', 'test-secret');
if (nodeEnv === 'production' && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

export type ExecutionProviderName = 'judge0' | 'docker' | 'disabled';

const executionProvider = (process.env.EXECUTION_PROVIDER || 'judge0') as ExecutionProviderName;
if (!['judge0', 'docker', 'disabled'].includes(executionProvider)) {
  throw new Error(`Unsupported EXECUTION_PROVIDER: ${executionProvider}`);
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest,
  port: Number(process.env.PORT) || 5000,
  mongoUri: isTest ? process.env.MONGODB_URI || '' : required('MONGODB_URI'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** OAuth client id for "Continue with Google". Sign-in with Google is disabled when unset. */
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  providers: {
    codeforces: (process.env.CODEFORCES_ENABLED || 'true') !== 'false',
  },
  execution: {
    provider: executionProvider,
    judge0Url: (process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/+$/, ''),
    judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  },
};
