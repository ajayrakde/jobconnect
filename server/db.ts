import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { config } from 'dotenv';
config();

import pg from 'pg';
const { Pool } = pg;

import { drizzle } from 'drizzle-orm/node-postgres'; // ✅ Use Supabase-compatible Drizzle adapter
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// ✅ Configure the pg pool (works with Supabase)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 20,
  idleTimeoutMillis: 30000
});

// Optional: handle unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// ✅ Supabase-compatible Drizzle DB instance
export const db = drizzle(pool, { schema });
