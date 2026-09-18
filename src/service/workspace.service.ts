import { BadRequest } from "../exception/errors.js";
import WorkSpaceRepository from "../repository/workspace.repository.js";
import type {
  WorkSpaceMemberRequest,
  WorkSpaceRequest,
} from "../types/dto/req/workspace.request.js";
import {
  WorkSpaceMemberRole,
  WorkSpaceMemberStatus,
  type WorkSpace,
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

    console.log("owner : ", ownerMember);

    const createWorkspace: WorkSpace =
      await this.workSpaceRepository.createWorkspaceWithOwner(dto, ownerMember);

    return createWorkspace;
  };
}

export default WorkSpaceService;
