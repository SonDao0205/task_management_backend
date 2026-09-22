import type { NextFunction, Request, Response } from "express";

export const logger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("Timer : ", Date.now());
  next();
};
