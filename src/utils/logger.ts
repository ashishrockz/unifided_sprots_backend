/**
 * @file    utils/logger.ts
 * @desc    Winston logger — JSON in production, colorized in dev.
 */
import winston from "winston";
const { combine, timestamp, errors, printf, colorize, json } = winston.format;
const devFmt = combine(colorize({ all: true }), timestamp({ format: "HH:mm:ss" }), errors({ stack: true }),
  printf(({ timestamp: t, level, message, stack }) => stack ? `${t} ${level}: ${message}\n${stack}` : `${t} ${level}: ${message}`));
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: process.env.NODE_ENV === "production" ? combine(timestamp(), errors({ stack: true }), json()) : devFmt,
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "logs/error.log", level: "error" }), new winston.transports.File({ filename: "logs/combined.log" })],
});
