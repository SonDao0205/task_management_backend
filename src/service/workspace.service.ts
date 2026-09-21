import { Authorization, BadRequest } from "../exception/errors.js";
import WorkSpaceRepository from "../repository/workspace.repository.js";
import type {
  WorkSpaceMemberRequest,
  WorkSpaceRequest,
} from "../types/dto/req/workspace.request.js";
import {
  WorkSpaceMemberRole,
  WorkSpaceMemberStatus,
  type WorkSpace,
  type WorkSpaceMember,
} from "../types/entity/workspace.types.js";

export class WorkSpaceService {
  private static instance: WorkSpaceService;
  private readonly workSpaceRepository: WorkSpaceRepository;

  constructor() {
    this.workSpaceRepository = WorkSpaceRepository.getInstance();
  }

  public static getInstance = (): WorkSpaceService => {
    if (!WorkSpaceService.instance) {
      WorkSpaceService.instance = new WorkSpaceService();
    }
    return this.instance;
  };

  getAll = async (): Promise<WorkSpace[]> => {
    const workspaces = await this.workSpaceRepository.findAll();
    return workspaces;
  };

  createWorkspace = async (
    dto: WorkSpaceRequest,
    user_id: string,
  ): Promise<WorkSpace> => {
    const { name, description } = dto;
    if (!name || !description) {
      throw new BadRequest("Vui lòng nhập đầy đủ thông tin!");
    }

    const ownerMember: WorkSpaceMemberRequest = {
      role: WorkSpaceMemberRole.OWNER,
      status: WorkSpaceMemberStatus.ACTIVE,
      member_id: user_id,
    };

    const createWorkspace: WorkSpace =
      await this.workSpaceRepository.createWorkspaceWithOwner(dto, ownerMember);

    return createWorkspace;
  };

  addMember = async (
    owner_id: string,
    dto: WorkSpaceMemberRequest,
  ): Promise<WorkSpaceMember> => {
    const { role, status, member_id, workspace_id } = dto;
    if (!role || !status || !member_id || !workspace_id) {
      throw new BadRequest("Vui lòng nhập đầy đủ thông tin!");
    }

    const isOwner = await this.workSpaceRepository.isOwner(
      owner_id,
      workspace_id,
    );

    if (member_id == owner_id) {
      throw new BadRequest("Bạn không thể thêm bản thân!");
    }

    if (!isOwner) {
      throw new Authorization(
        "Bạn không đủ thẩm quyền thực hiện chức năng này!",
      );
    }

    const member = await this.workSpaceRepository.addMemberToWorkspace(dto);

    return member;
  };
}

export default WorkSpaceService;
