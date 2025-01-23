import { createLogger, format, transports } from "winston";
import { MySQLTransport } from "./mysql-transport";

const { combine, timestamp, printf } = format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  format: combine(timestamp(), customFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "application.log" }),
    new MySQLTransport({
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      tableName: "logs",
    }),
  ],
});

export default logger;
