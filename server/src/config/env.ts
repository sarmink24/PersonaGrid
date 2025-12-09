import { config } from 'dotenv';

config();

type RequiredEnv = 'DATABASE_URL' | 'PORT';

const ensureEnv = (key: RequiredEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(ensureEnv('PORT')),
  databaseUrl: ensureEnv('DATABASE_URL'),
};

