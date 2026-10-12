import { Authorization, BadRequest, NotFound } from "../exception/errors.js";
import WorkSpaceRepository from "../repository/workspace.repository.js";
import type {
  WorkSpaceMemberCreateRequest,
  WorkSpaceMemberUpdate,
  WorkSpaceRequest,
  WorkSpaceUpdateRequest,
} from "../types/dto/req/workspace.request.js";
import {
  WorkSpaceMemberRole,
  WorkSpaceMemberStatus,
  WorkSpaceStatus,
  type WorkSpaceDetail,
  type WorkSpaceMemberRecord,
  type WorkSpaceSummary,
} from "../types/entity/workspace.types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class WorkSpaceService {
  private static instance: WorkSpaceService;
  private readonly workSpaceRepository: WorkSpaceRepository;

  private constructor() {
    this.workSpaceRepository = WorkSpaceRepository.getInstance();
  }

  public static getInstance = (): WorkSpaceService => {
    if (!WorkSpaceService.instance) {
      WorkSpaceService.instance = new WorkSpaceService();
    }
    return WorkSpaceService.instance;
  };

  private validateId = (value: string, fieldName: string): void => {
    if (!UUID_PATTERN.test(value)) {
      throw new BadRequest(`${fieldName} không hợp lệ!`);
    }
  };

  private validateName = (value: unknown): string => {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequest("Tên workspace không được để trống!");
    }
    const name = value.trim();
    if (name.length > 255) {
      throw new BadRequest("Tên workspace không được vượt quá 255 ký tự!");
    }
    return name;
  };

  private validateDescription = (value: unknown): string => {
    if (typeof value !== "string") {
      throw new BadRequest("Mô tả workspace không hợp lệ!");
    }
    const description = value.trim();
    if (description.length > 255) {
      throw new BadRequest("Mô tả workspace không được vượt quá 255 ký tự!");
    }
    return description;
  };

  private getActiveMembership = async (
    user_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord> => {
    this.validateId(user_id, "Người dùng");
    this.validateId(workspace_id, "Workspace");
    const membership = await this.workSpaceRepository.findMembershipByUser(
      user_id,
      workspace_id,
    );
    if (!membership || membership.status !== WorkSpaceMemberStatus.ACTIVE) {
      throw new Authorization("Bạn không hoạt động trong workspace này!");
    }
    return membership;
  };

  private requireOwner = async (
    user_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord> => {
    const membership = await this.getActiveMembership(user_id, workspace_id);
    if (membership.role !== WorkSpaceMemberRole.OWNER) {
      throw new Authorization("Chỉ owner được phép thực hiện thao tác này!");
    }
    return membership;
  };

  getAll = async (user_id: string): Promise<WorkSpaceSummary[]> => {
    this.validateId(user_id, "Người dùng");
    return this.workSpaceRepository.findAllByUser(user_id);
  };

  getById = async (
    workspace_id: string,
    user_id: string,
  ): Promise<WorkSpaceDetail> => {
    this.validateId(workspace_id, "Workspace");
    this.validateId(user_id, "Người dùng");
    const workspace = await this.workSpaceRepository.findByIdForUser(
      workspace_id,
      user_id,
    );
    if (!workspace) {
      throw new NotFound(
        "Workspace không tồn tại hoặc bạn không có quyền truy cập!",
      );
    }
    return workspace;
  };

  getMembership = async (workspace_id: string, user_id: string) => {
    return await this.getActiveMembership(user_id, workspace_id);
  };

  getMembers = async (workspace_id: string, user_id: string) => {
    await this.getActiveMembership(user_id, workspace_id);
    return this.workSpaceRepository.getMembers(workspace_id);
  };

  createWorkspace = async (
    dto: WorkSpaceRequest,
    user_id: string,
  ): Promise<WorkSpaceDetail> => {
    this.validateId(user_id, "Người dùng");
    if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
      throw new BadRequest("Dữ liệu workspace không hợp lệ!");
    }

    const request: WorkSpaceRequest = { name: this.validateName(dto.name) };
    if (dto.description !== undefined) {
      request.description = this.validateDescription(dto.description);
    }
    if (dto.status !== undefined) {
      if (!Object.values(WorkSpaceStatus).includes(dto.status)) {
        throw new BadRequest("Trạng thái workspace không hợp lệ!");
      }
      request.status = dto.status;
    }

    const workspace = await this.workSpaceRepository.createWorkspaceWithOwner(
      request,
      {
        role: WorkSpaceMemberRole.OWNER,
        status: WorkSpaceMemberStatus.ACTIVE,
        member_id: user_id,
      },
    );
    return this.getById(workspace.id, user_id);
  };

  updateWorkspace = async (
    workspace_id: string,
    user_id: string,
    dto: WorkSpaceUpdateRequest,
  ): Promise<WorkSpaceDetail> => {
    await this.requireOwner(user_id, workspace_id);
    if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
      throw new BadRequest("Dữ liệu cập nhật workspace không hợp lệ!");
    }

    const inputFields = Object.keys(dto);
    const allowedFields = new Set(["name", "description", "status"]);
    if (
      inputFields.length === 0 ||
      inputFields.some((field) => !allowedFields.has(field))
    ) {
      throw new BadRequest("Không có dữ liệu workspace hợp lệ để cập nhật!");
    }

    const update: WorkSpaceUpdateRequest = {};
    if (dto.name !== undefined) update.name = this.validateName(dto.name);
    if (dto.description !== undefined) {
      update.description = this.validateDescription(dto.description);
    }
    if (dto.status !== undefined) {
      if (!Object.values(WorkSpaceStatus).includes(dto.status)) {
        throw new BadRequest("Trạng thái workspace không hợp lệ!");
      }
      update.status = dto.status;
    }

    const workspace = await this.workSpaceRepository.updateWorkspace(
      workspace_id,
      update,
    );
    if (!workspace) throw new NotFound("Workspace không tồn tại!");
    return this.getById(workspace_id, user_id);
  };

  deleteWorkspace = async (
    workspace_id: string,
    user_id: string,
  ): Promise<void> => {
    await this.requireOwner(user_id, workspace_id);
    const deleted =
      await this.workSpaceRepository.deleteWorkspace(workspace_id);
    if (!deleted) throw new NotFound("Workspace không tồn tại!");
  };

  addMember = async (
    owner_id: string,
    workspace_id: string,
    dto: WorkSpaceMemberCreateRequest,
  ): Promise<WorkSpaceMemberRecord> => {
    await this.requireOwner(owner_id, workspace_id);
    if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
      throw new BadRequest("Dữ liệu thành viên không hợp lệ!");
    }

    let member_id = dto.member_id;
    if (!member_id && dto.email) {
      member_id =
        (await this.workSpaceRepository.findUserIdByEmail(dto.email.trim())) ??
        undefined;
    }
    if (!member_id) throw new NotFound("Người dùng không tồn tại!");
    this.validateId(member_id, "Thành viên");
    if (member_id === owner_id) {
      throw new BadRequest("Bạn không thể thêm bản thân!");
    }

    const role = dto.role ?? WorkSpaceMemberRole.MEMBER;
    const status = dto.status ?? WorkSpaceMemberStatus.ACTIVE;
    if (!Object.values(WorkSpaceMemberRole).includes(role)) {
      throw new BadRequest("Vai trò thành viên không hợp lệ!");
    }
    if (!Object.values(WorkSpaceMemberStatus).includes(status)) {
      throw new BadRequest("Trạng thái thành viên không hợp lệ!");
    }

    return this.workSpaceRepository.addMemberToWorkspace({
      member_id,
      workspace_id,
      role,
      status,
    });
  };

  updateMember = async (
    owner_id: string,
    workspace_id: string,
    membership_id: string,
    dto: Pick<WorkSpaceMemberUpdate, "role" | "status">,
  ): Promise<WorkSpaceMemberRecord> => {
    await this.requireOwner(owner_id, workspace_id);
    this.validateId(membership_id, "Thành viên");
    const target = await this.workSpaceRepository.findMembershipById(
      membership_id,
      workspace_id,
    );
    if (!target)
      throw new NotFound("Thành viên không tồn tại trong workspace!");
    return this.updateMemberByUserId(
      owner_id,
      workspace_id,
      target.member_id,
      dto,
    );
  };

  updateMemberByUserId = async (
    owner_id: string,
    workspace_id: string,
    member_id: string,
    dto: Pick<WorkSpaceMemberUpdate, "role" | "status">,
  ): Promise<WorkSpaceMemberRecord> => {
    await this.requireOwner(owner_id, workspace_id);
    this.validateId(member_id, "Thành viên");
    if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
      throw new BadRequest("Dữ liệu thành viên không hợp lệ!");
    }
    if (!Object.values(WorkSpaceMemberRole).includes(dto.role)) {
      throw new BadRequest("Vai trò thành viên không hợp lệ!");
    }
    if (!Object.values(WorkSpaceMemberStatus).includes(dto.status)) {
      throw new BadRequest("Trạng thái thành viên không hợp lệ!");
    }
    const updated = await this.workSpaceRepository.updateMember(
      member_id,
      workspace_id,
      dto.status,
      dto.role,
    );
    if (!updated)
      throw new NotFound("Thành viên không tồn tại trong workspace!");
    return updated;
  };

  deleteMember = async (
    owner_id: string,
    workspace_id: string,
    membership_id: string,
  ): Promise<void> => {
    await this.requireOwner(owner_id, workspace_id);
    this.validateId(membership_id, "Thành viên");
    const target = await this.workSpaceRepository.findMembershipById(
      membership_id,
      workspace_id,
    );
    if (!target)
      throw new NotFound("Thành viên không tồn tại trong workspace!");
    await this.deleteMemberByUserId(owner_id, workspace_id, target.member_id);
  };

  deleteMemberByUserId = async (
    owner_id: string,
    workspace_id: string,
    member_id: string,
  ): Promise<void> => {
    await this.requireOwner(owner_id, workspace_id);
    this.validateId(member_id, "Thành viên");
    if (member_id === owner_id) {
      throw new BadRequest("Bạn không thể xoá bản thân!");
    }
    const deleted = await this.workSpaceRepository.deleteMember(
      member_id,
      workspace_id,
    );
    if (!deleted)
      throw new NotFound("Thành viên không tồn tại trong workspace!");
  };
}

export default WorkSpaceService;
