import type { CookieOptions, Request, Response } from "express";
import AuthService from "../service/auth.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type {
  LoginResponse,
  RegisterResponse,
} from "../types/dto/res/auth.response.js";
import type { PublicUser } from "../types/entity/user.types.js";

const REFRESH_COOKIE = "refreshToken";
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge:
    Number(process.env.REFRESH_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000,
};
const refreshCookieClearOptions: CookieOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  secure: refreshCookieOptions.secure,
  sameSite: refreshCookieOptions.sameSite,
  path: refreshCookieOptions.path,
};

class AuthController {
  private static instance: AuthController;
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  public static getInstance = (): AuthController => {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return this.instance;
  };

  register = async (
    req: Request,
    res: Response<ApiResponseData<RegisterResponse>>,
  ) => {
    const response = await this.authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: "Register User Successfully!",
      data: response,
    });
  };

  login = async (
    req: Request,
    res: Response<ApiResponseData<LoginResponse>>,
  ) => {
    const session = await this.authService.login(req.body);
    res.cookie(REFRESH_COOKIE, session.refresh_token, refreshCookieOptions);
    return res.status(201).json({
      success: true,
      message: "Login User Successfully!",
      data: session.response,
    });
  };

  me = async (req: Request, res: Response<ApiResponseData<PublicUser>>) => {
    const user_id = req.auth?.user_id;
    const response = await this.authService.getUser(String(user_id));
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin người dùng thành công!",
      data: response,
    });
  };

  refresh = async (
    req: Request,
    res: Response<ApiResponseData<{ access_token: string }>>,
  ) => {
    try {
      const session = await this.authService.refreshSession(
        String(req.cookies?.[REFRESH_COOKIE] ?? ""),
      );
      res.cookie(REFRESH_COOKIE, session.refresh_token, refreshCookieOptions);
      return res.status(200).json({
        success: true,
        message: "Access Token đã được làm mới thành công!",
        data: { access_token: session.access_token },
      });
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, refreshCookieClearOptions);
      throw error;
    }
  };

  logOut = async (req: Request, res: Response<ApiResponseData<null>>) => {
    const access_token = req.auth?.access_token;
    const user_id = req.auth?.user_id;
    await this.authService.logOut(String(user_id), String(access_token));
    res.clearCookie(REFRESH_COOKIE, refreshCookieClearOptions);

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!",
      data: null,
    });
  };
}

export default AuthController;
