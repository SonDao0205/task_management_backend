import type { Request, Response } from "express";
import UserService from "../service/user.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type { User } from "../types/entity/user.types.js";

class UserController {
  private static instance: UserController;
  private userService: UserService;

  constructor() {
    this.userService = UserService.getInstance();
  }

  public static getInstance = (): UserController => {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return this.instance;
  };

  getAllUser = async (req: Request, res: Response<ApiResponseData<User[]>>) => {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const response = await this.userService.getAllUsers(search);
    return res.status(200).json({
      success: true,
      message: "Get User List Successfully!",
      data: response,
    });
  };

  changePassword = async (
    req: Request,
    res: Response<ApiResponseData<null>>,
  ) => {
    await this.userService.changePassword(String(req.auth?.user_id), req.body);
    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công!",
      data: null,
    });
  };
}

export default UserController;
