import { createPool, Pool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool: Pool | null = null;

export const connection = async (): Promise<Pool> => {
  if (!pool) {
    pool = await createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3306", 10),
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "100", 10),
      dateStrings: true,
    });
  }
  return pool;
};

export const queryAsync = (conn: any, sql: string, values?: any) => {
  return new Promise((resolve, reject) => {
    conn.query(sql, values, (err: any, results: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
