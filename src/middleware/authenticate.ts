import type { NextFunction, Request, Response } from "express";
import type { ApiResponseData } from "../types/dto/res/response.js";
import { Authenticate } from "../exception/errors.js";
import TokenService from "../service/token.service.js";

const tokenService = TokenService.getInstance();

export const authenticate = async (
  req: Request,
  res: Response<ApiResponseData<null>>,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header) {
    throw new Authenticate("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
  }
  const token = String(header).slice(7);

  const { payload } = await tokenService.verifyAccessToken(String(token));

  req.auth = {
    user_id: payload.user_id,
    access_token: token,
  };
  next();
};
