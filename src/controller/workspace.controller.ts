import type { Request, Response } from "express";
import WorkSpaceService from "../service/workspace.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import {
  type WorkSpace,
  type WorkSpaceMember,
} from "../types/entity/workspace.types.js";

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

  addMemberToWorkspace = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMember>>,
  ) => {
    const user_id = req.auth?.user_id;
    const response = await this.workSpaceService.addMember(
      String(user_id),
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Thêm thành viên thành công!",
      data: response,
    });
  };

  deleteMemberToWorkspace = async (
    req: Request,
    res: Response<ApiResponseData<null>>,
  ) => {
    const user_id = req.auth?.user_id;
    const { memberId, workspaceId } = req.params;
    const response = await this.workSpaceService.deleteMember(
      String(user_id),
      String(memberId),
      String(workspaceId),
    );
    return res.status(200).json({
      success: true,
      message: "Xoá thành viên thành công!",
      data: null,
    });
  };

  updateMember = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMember>>,
  ) => {
    const user_id = req.auth?.user_id;
    const { memberId, workspaceId } = req.params;
    const { status, role } = req.body;
    const response = await this.workSpaceService.updateMember(String(user_id), {
      member_id: String(memberId),
      workspace_id: String(workspaceId),
      status,
      role,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      data: response,
    });
  };
}

export default WorkSpaceController;
