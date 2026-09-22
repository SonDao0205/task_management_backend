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
    const user_id = req.auth?.user_id;
    const response = await this.userService.getAllUsers();
    return res.status(200).json({
      success: true,
      message: "Get User List Successfully!",
      data: response,
    });
  };
}

export default UserController;
