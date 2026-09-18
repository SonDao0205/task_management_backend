import type { Request, Response } from "express";
import WorkSpaceService from "../service/workspace.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type { WorkSpace } from "../types/entity/workspace.types.js";

export class WorkSpaceController {
  private static instance: WorkSpaceController;
  private readonly workSpaceService: WorkSpaceService;

  constructor() {
    this.workSpaceService = WorkSpaceService.getInstance();
  }

  public static getInstance = (): WorkSpaceController => {
    if (!WorkSpaceController.instance) {
      WorkSpaceController.instance = new WorkSpaceController();
    }
    return this.instance;
  };

  getAll = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpace[]>>,
  ) => {
    const response = await this.workSpaceService.getAll();
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách Workspace thành công!",
      data: response,
    });
  };

  createWorkspace = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpace>>,
  ) => {
    const user_id = req.auth?.user_id;
    const body = req.body;
    const response = await this.workSpaceService.createWorkspace(
      body,
      String(user_id),
    );

    return res.status(201).json({
      success: true,
      message: "Tạo Workspace thành công!",
      data: response,
    });
  };
}

export default WorkSpaceController;
