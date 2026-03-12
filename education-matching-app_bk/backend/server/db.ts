import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// SQL logger for debugging
const sqlLogger = {
  logQuery(query: string, params: unknown[]): void {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} [SQL] ${query}`);
    if (params.length > 0) {
      console.log(`${formattedTime} [SQL Params] ${JSON.stringify(params)}`);
    }
  },
};

export const db = drizzle(pool, { 
  schema,
  logger: sqlLogger,
});
