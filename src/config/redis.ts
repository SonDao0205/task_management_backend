import { createClient } from "redis";

const redisPort = Number(process.env.REDIS_PORT ?? 6379);

if (!Number.isInteger(redisPort) || redisPort <= 0 || redisPort > 65535) {
  throw new Error("REDIS_PORT must be a valid TCP port");
}

if (!process.env.REDIS_USERNAME || !process.env.REDIS_PASSWORD) {
  throw new Error("REDIS_USERNAME and REDIS_PASSWORD are required");
}

export const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: redisPort,
  },
});

redisClient.on("error", (err) => console.error("Redis error:", err));
