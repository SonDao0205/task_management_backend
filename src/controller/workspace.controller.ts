import type { Request, Response } from "express";
import WorkSpaceService from "../service/workspace.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type {
  WorkSpaceDetail,
  WorkSpaceMemberDto,
  WorkSpaceMemberRecord,
  WorkSpaceSummary,
} from "../types/entity/workspace.types.js";

class WorkSpaceController {
  private static instance: WorkSpaceController;
  private readonly workSpaceService: WorkSpaceService;

  private constructor() {
    this.workSpaceService = WorkSpaceService.getInstance();
  }

  public static getInstance = (): WorkSpaceController => {
    if (!WorkSpaceController.instance) {
      WorkSpaceController.instance = new WorkSpaceController();
    }
    return WorkSpaceController.instance;
  };

  getAll = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceSummary[]>>,
  ) => {
    const data = await this.workSpaceService.getAll(String(req.auth?.user_id));
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách workspace thành công!",
      data,
    });
  };

  getById = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceDetail>>,
  ) => {
    const data = await this.workSpaceService.getById(
      String(req.params.workspaceId),
      String(req.auth?.user_id),
    );
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin workspace thành công!",
      data,
    });
  };

  createWorkspace = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceDetail>>,
  ) => {
    const data = await this.workSpaceService.createWorkspace(
      req.body,
      String(req.auth?.user_id),
    );
    return res.status(201).json({
      success: true,
      message: "Tạo workspace thành công!",
      data,
    });
  };

  updateWorkspace = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceDetail>>,
  ) => {
    const data = await this.workSpaceService.updateWorkspace(
      String(req.params.workspaceId),
      String(req.auth?.user_id),
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật workspace thành công!",
      data,
    });
  };

  deleteWorkspace = async (
    req: Request,
    res: Response<ApiResponseData<null>>,
  ) => {
    await this.workSpaceService.deleteWorkspace(
      String(req.params.workspaceId),
      String(req.auth?.user_id),
    );
    return res.status(200).json({
      success: true,
      message: "Xoá workspace thành công!",
      data: null,
    });
  };

  getMembers = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMemberDto[]>>,
  ) => {
    const data = await this.workSpaceService.getMembers(
      String(req.params.workspaceId),
      String(req.auth?.user_id),
    );
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thành viên thành công!",
      data,
    });
  };

  addMember = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMemberRecord>>,
  ) => {
    const data = await this.workSpaceService.addMember(
      String(req.auth?.user_id),
      String(req.params.workspaceId),
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Thêm thành viên thành công!",
      data,
    });
  };

  addMemberLegacy = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMemberRecord>>,
  ) => {
    const data = await this.workSpaceService.addMember(
      String(req.auth?.user_id),
      String(req.body?.workspace_id),
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Thêm thành viên thành công!",
      data,
    });
  };

  updateMember = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMemberRecord>>,
  ) => {
    const data = await this.workSpaceService.updateMember(
      String(req.auth?.user_id),
      String(req.params.workspaceId),
      String(req.params.memberId),
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành viên thành công!",
      data,
    });
  };

  updateMemberLegacy = async (
    req: Request,
    res: Response<ApiResponseData<WorkSpaceMemberRecord>>,
  ) => {
    const data = await this.workSpaceService.updateMemberByUserId(
      String(req.auth?.user_id),
      String(req.params.workspaceId),
      String(req.params.memberId),
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật thành viên thành công!",
      data,
    });
  };

  deleteMember = async (
    req: Request,
    res: Response<ApiResponseData<null>>,
  ) => {
    await this.workSpaceService.deleteMember(
      String(req.auth?.user_id),
      String(req.params.workspaceId),
      String(req.params.memberId),
    );
    return res.status(200).json({
      success: true,
      message: "Xoá thành viên thành công!",
      data: null,
    });
  };

  deleteMemberLegacy = async (
    req: Request,
    res: Response<ApiResponseData<null>>,
  ) => {
    await this.workSpaceService.deleteMemberByUserId(
      String(req.auth?.user_id),
      String(req.params.workspaceId),
      String(req.params.memberId),
    );
    return res.status(200).json({
      success: true,
      message: "Xoá thành viên thành công!",
      data: null,
    });
  };
}

export default WorkSpaceController;
