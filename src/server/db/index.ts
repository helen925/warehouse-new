import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "../../env.js";
import * as schema from "./schema";

// Parse the database connection string
const sql = neon(env.POSTGRES_URL_NON_POOLING);

// Create Drizzle client
export const db = drizzle(sql, { schema });

// Export schema for usage in other parts of the application
export * from "./schema"; 