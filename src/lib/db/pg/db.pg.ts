// import { Logger } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { mockQuery } from "../mock-db";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

// Use mock database if PostgreSQL URL is not provided
export const pgDb = process.env.POSTGRES_URL 
  ? drizzlePg(process.env.POSTGRES_URL, {
      //   logger: new MyLogger(),
    })
  : mockQuery as any; // Fallback to mock for development
