import type { ErrorRequestHandler, Response } from "express";
import { Authenticate, Authorization, BadRequest, NotFound } from "./errors.js";
import type { ApiResponseData } from "../types/dto/res/response.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res: Response<ApiResponseData<null>>,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof BadRequest) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null,
      error: String(error.details),
    });
    return;
  }

  if (error instanceof NotFound) {
    res.status(404).json({
      success: false,
      message: error.message,
      data: null,
      error: String(error.details),
    });
    return;
  }

  if (error instanceof Authenticate) {
    res.status(401).json({
      success: false,
      message: error.message,
      data: null,
      error: String(error.details),
    });
    return;
  }

  if (error instanceof Authorization) {
    res.status(403).json({
      success: false,
      message: error.message,
      data: null,
      error: String(error.details),
    });
    return;
  }

  if (error.constraint === "email_unq") {
    res.status(400).json({
      success: false,
      message: "Email đã tồn tại!",
      data: null,
      error: String(error.details),
    });
    return;
  }

  if (error.constraint === "phone_unq") {
    res.status(400).json({
      success: false,
      message: "Số điện thoại đã tồn tại!",
      data: null,
      error: String(error.details),
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Lỗi hệ thống!",
    data: null,
    error: error,
  });
};
