import type { Request, Response } from "express";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type { GroupChat } from "../types/entity/group_chat.types.js";
import GroupService from "../service/group.service.js";

class GroupController {
  private static instance: GroupController;
  private groupService: GroupService;

  constructor() {
    this.groupService = GroupService.getInstance();
  }

  public static getInstance = () => {
    if (!GroupController.instance) {
      GroupController.instance = new GroupController();
    }
    return this.instance;
  };

  getGroups = async (
    req: Request,
    res: Response<ApiResponseData<GroupChat[]>>,
  ) => {
    const userId = req.auth?.user_id;
    const { limit, offset } = req.params;
    const response = await this.groupService.getGroupsByUser(
      String(userId),
      Number(limit),
      Number(offset),
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách group chat thành công!",
      data: response,
    });
  };
}

export default GroupController;
