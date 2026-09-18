import type { Request, Response } from "express";
import AuthService from "../service/auth.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type {
  LoginResponse,
  RegisterResponse,
} from "../types/dto/res/auth.response.js";
import type { User } from "../types/entity/user.types.js";

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
    const response = await this.authService.login(req.body);
    return res.status(201).json({
      success: true,
      message: "Login User Successfully!",
      data: response,
    });
  };

  me = async (req: Request, res: Response<ApiResponseData<User>>) => {
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
    const user_id = req.auth?.user_id;
    const { refresh_token } = req.body;
    const response = await this.authService.refreshSession(
      String(user_id),
      refresh_token,
    );

    return res.status(201).json({
      success: true,
      message: "Access Token đã được làm mới thành công!",
      data: response,
    });
  };

  logOut = async (req: Request, res: Response<ApiResponseData<null>>) => {
    const access_token = req.auth?.access_token;
    const user_id = req.auth?.user_id;
    await this.authService.logOut(String(user_id), String(access_token));

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!",
      data: null,
    });
  };
}

export default AuthController;
