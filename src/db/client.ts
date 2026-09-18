import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (typeof WebSocket === "undefined") neonConfig.webSocketConstructor = ws;
export const createNeonDb = (databaseUrl: string) => drizzle({ client: new Pool({ connectionString: databaseUrl }), schema });
export type AppDb = ReturnType<typeof createNeonDb>;
export const getDb = () => process.env.DATABASE_URL ? createNeonDb(process.env.DATABASE_URL) : undefined;
