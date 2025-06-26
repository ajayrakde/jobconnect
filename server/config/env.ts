import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  CACHE_ENABLED: z.string().optional(),
  CACHE_TTL: z.string().optional(),
  CACHE_MIN_RECORDS: z.string().optional(),
  CACHE_CANDIDATES_ENABLED: z.string().optional(),
  CACHE_CANDIDATES_TTL: z.string().optional(),
  CACHE_CANDIDATES_MIN_RECORDS: z.string().optional(),
  CACHE_EMPLOYERS_ENABLED: z.string().optional(),
  CACHE_EMPLOYERS_TTL: z.string().optional(),
  CACHE_EMPLOYERS_MIN_RECORDS: z.string().optional(),
  CACHE_JOBS_ENABLED: z.string().optional(),
  CACHE_JOBS_TTL: z.string().optional(),
  CACHE_JOBS_MIN_RECORDS: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_PRIVATE_KEY_B64: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

export const env = envSchema.parse(process.env);
