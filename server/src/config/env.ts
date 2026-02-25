import { config } from 'dotenv';

config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(required('PORT')),
  databaseUrl: required('DATABASE_URL'),
  clientOrigin: required('CLIENT_ORIGIN'),
  jwtSecret: required('JWT_SECRET'),
  adminJwtSecret: required('ADMIN_JWT_SECRET'),
};
