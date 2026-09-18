import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { pool } from "./config/database.js";
import { userRouter } from "./router/userRouter.js";
import { errorHandler } from "./exception/error_handler.js";
import { NotFound } from "./exception/errors.js";
import { authRouter } from "./router/authRouter.js";
import { redisClient } from "./config/redis.js";
import { workspaceRouter } from "./router/workspaceRouter.js";

const bootstrap = async () => {
  const app = express();
  const PORT = process.env.PORT;

  app.use(cors());
  app.use(express.json());

  // router
  const prefix = "/api/v1";
  app.use(prefix, userRouter);
  app.use(prefix, authRouter);
  app.use(prefix, workspaceRouter);

  app.use((_req, _res, next) => {
    next(new NotFound("API endpoint not found"));
  });

  // connect DB
  try {
    await pool.query("SELECT 1");

    console.log("Connect To Database : SUCCESS!");
  } catch (error) {
    console.log("Connect To Database : FAILD!");
    console.log("LOG : ", error);
    process.exit(1);
  }

  // connect redis
  try {
    await redisClient.connect();
    console.log("Connect To Redis : SUCCESS!");
  } catch (error) {
    console.log("Connect To Redis : FAILD!");
    console.log("LOG : ", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server is running in port : ${PORT} `);
  });

  app.use(errorHandler);
};

await bootstrap();
