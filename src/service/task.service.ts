import { Authorization, BadRequest, NotFound } from "../exception/errors.js";
import TaskRepository from "../repository/task.repository.js";
import type {
  CreateTaskData,
  CreateTaskRequest,
  UpdateTaskData,
  UpdateTaskRequest,
} from "../types/dto/req/task.request.js";
import {
  TaskStatus,
  type Task,
  type TaskWithAssignees,
} from "../types/entity/task.types.js";
import {
  WorkSpaceMemberRole,
  WorkSpaceMemberStatus,
  type WorkSpaceMemberRecord,
} from "../types/entity/workspace.types.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MANAGER_ROLES = new Set<WorkSpaceMemberRole>([
  WorkSpaceMemberRole.OWNER,
  WorkSpaceMemberRole.MASTER,
]);

const MEMBER_ALLOWED_STATUSES = new Set<TaskStatus>([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REVIEW,
]);

const UPDATE_FIELDS = new Set<keyof UpdateTaskRequest>([
  "title",
  "description",
  "priority",
  "start_at",
  "end_at",
  "status",
]);

class TaskService {
  private static instance: TaskService;
  private readonly taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = TaskRepository.getInstance();
  }

  public static getInstance = (): TaskService => {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return this.instance;
  };

  getAllTask = async (workspace_id: string) => {
    return this.taskRepository.getAllTask(workspace_id);
  };

  private validateId = (value: string, fieldName: string): void => {
    if (!value || !UUID_PATTERN.test(value)) {
      throw new BadRequest(`${fieldName} không hợp lệ!`);
    }
  };

  private validateText = (value: unknown, fieldName: string): string => {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequest(`${fieldName} không được để trống!`);
    }

    const normalizedValue = value.trim();
    if (normalizedValue.length > 255) {
      throw new BadRequest(`${fieldName} không được vượt quá 255 ký tự!`);
    }
    return normalizedValue;
  };

  private validatePriority = (priority: unknown): number => {
    if (
      typeof priority !== "number" ||
      !Number.isInteger(priority) ||
      priority < 1 ||
      priority > 5
    ) {
      throw new BadRequest("Độ ưu tiên phải là số nguyên từ 1 đến 5!");
    }
    return priority;
  };

  private parseDate = (value: Date | string, fieldName: string): Date => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequest(`${fieldName} không đúng định dạng ngày giờ!`);
    }
    return date;
  };

  private normalizeMemberIds = (member_ids?: string[]): string[] => {
    if (member_ids === undefined) return [];
    if (!Array.isArray(member_ids)) {
      throw new BadRequest("member_ids phải là một mảng!");
    }

    for (const member_id of member_ids) {
      if (typeof member_id !== "string" || !UUID_PATTERN.test(member_id)) {
        throw new BadRequest("Danh sách thành viên chứa ID không hợp lệ!");
      }
    }

    const uniqueMemberIds = [...new Set(member_ids)];
    if (uniqueMemberIds.length !== member_ids.length) {
      throw new BadRequest("Danh sách thành viên không được chứa ID trùng!");
    }

    return uniqueMemberIds;
  };

  private getTaskOrThrow = async (
    task_id: string,
  ): Promise<TaskWithAssignees> => {
    this.validateId(task_id, "Task");
    const task = await this.taskRepository.findById(task_id);
    if (!task) {
      throw new NotFound("Task không tồn tại!");
    }
    return task;
  };

  private getActiveActor = async (
    actor_user_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord> => {
    this.validateId(actor_user_id, "Người thao tác");
    const actor = await this.taskRepository.findWorkspaceMemberByUser(
      actor_user_id,
      workspace_id,
    );

    if (!actor || actor.status !== WorkSpaceMemberStatus.ACTIVE) {
      throw new Authorization("Bạn không hoạt động trong workspace này!");
    }
    return actor;
  };

  private requireManager = (actor: WorkSpaceMemberRecord): void => {
    if (!MANAGER_ROLES.has(actor.role)) {
      throw new Authorization(
        "Chỉ owner hoặc master được phép thực hiện thao tác này!",
      );
    }
  };

  createTask = async (dto: CreateTaskRequest, actor_user_id: string) => {
    if (!dto || typeof dto !== "object") {
      throw new BadRequest("Dữ liệu task không hợp lệ!");
    }

    const title = this.validateText(dto.title, "Tiêu đề");
    const description = this.validateText(dto.description, "Mô tả");
    const priority = this.validatePriority(dto.priority);
    const start_at = this.parseDate(dto.start_at, "Thời gian bắt đầu");
    const end_at = this.parseDate(dto.end_at, "Thời gian kết thúc");

    this.validateId(dto.workspace_id, "Workspace");
    this.validateId(actor_user_id, "Người tạo");

    if (!Object.values(TaskStatus).includes(dto.status)) {
      throw new BadRequest("Trạng thái task không hợp lệ!");
    }
    if (start_at.getTime() < Date.now()) {
      throw new BadRequest("Thời gian bắt đầu không được nằm trong quá khứ!");
    }
    if (end_at.getTime() <= start_at.getTime()) {
      throw new BadRequest("Thời gian kết thúc phải sau thời gian bắt đầu!");
    }

    const actor = await this.taskRepository.findWorkspaceMemberByUser(
      actor_user_id,
      dto.workspace_id,
    );
    if (!actor || actor.status !== WorkSpaceMemberStatus.ACTIVE) {
      throw new Authorization("Bạn không hoạt động trong workspace này!");
    }
    if (
      actor.role !== WorkSpaceMemberRole.OWNER &&
      actor.role !== WorkSpaceMemberRole.MASTER
    ) {
      throw new Authorization("Chỉ owner hoặc master được phép tạo task!");
    }

    const member_ids = this.normalizeMemberIds(dto.member_ids);
    if (member_ids.length > 0) {
      const members = await this.taskRepository.findWorkspaceMembersByIds(
        dto.workspace_id,
        member_ids,
      );

      if (members.length !== member_ids.length) {
        throw new BadRequest(
          "Một hoặc nhiều thành viên không tồn tại trong workspace!",
        );
      }
      if (
        members.some(({ status }) => status !== WorkSpaceMemberStatus.ACTIVE)
      ) {
        throw new BadRequest(
          "Chỉ được giao task cho thành viên đang hoạt động!",
        );
      }
    }

    const taskData: CreateTaskData = {
      title,
      description,
      priority,
      start_at,
      end_at,
      status: dto.status,
      workspace_id: dto.workspace_id,
      created_by: actor.id,
    };

    if (member_ids.length === 0) {
      return this.taskRepository.createTask(taskData);
    }

    return this.taskRepository.createTaskWithMembers(taskData, member_ids);
  };

  assignMembers = async (
    task_id: string,
    member_ids_input: string[],
    actor_user_id: string,
  ) => {
    const task = await this.getTaskOrThrow(task_id);
    const actor = await this.getActiveActor(actor_user_id, task.workspace_id);
    this.requireManager(actor);

    const member_ids = this.normalizeMemberIds(member_ids_input);
    if (member_ids.length === 0) {
      throw new BadRequest("Cần chọn ít nhất một thành viên để giao task!");
    }

    const members = await this.taskRepository.findWorkspaceMembersByIds(
      task.workspace_id,
      member_ids,
    );
    if (members.length !== member_ids.length) {
      throw new BadRequest(
        "Một hoặc nhiều thành viên không tồn tại trong workspace!",
      );
    }
    if (members.some(({ status }) => status !== WorkSpaceMemberStatus.ACTIVE)) {
      throw new BadRequest("Chỉ được giao task cho thành viên đang hoạt động!");
    }

    return this.taskRepository.assignMembers(task.id, member_ids);
  };

  unassignMembers = async (
    task_id: string,
    member_ids_input: string[],
    actor_user_id: string,
  ) => {
    const task = await this.getTaskOrThrow(task_id);
    const actor = await this.getActiveActor(actor_user_id, task.workspace_id);
    this.requireManager(actor);

    const member_ids = this.normalizeMemberIds(member_ids_input);
    if (member_ids.length === 0) {
      throw new BadRequest("Cần chọn ít nhất một thành viên để bỏ giao task!");
    }

    const members = await this.taskRepository.findWorkspaceMembersByIds(
      task.workspace_id,
      member_ids,
    );
    if (members.length !== member_ids.length) {
      throw new BadRequest(
        "Một hoặc nhiều thành viên không tồn tại trong workspace!",
      );
    }

    return this.taskRepository.unassignMembers(task.id, member_ids);
  };

  updateTask = async (
    task_id: string,
    dto: UpdateTaskRequest,
    actor_user_id: string,
  ): Promise<Task> => {
    if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
      throw new BadRequest("Dữ liệu cập nhật không hợp lệ!");
    }

    const inputFields = Object.keys(dto);
    if (inputFields.length === 0) {
      throw new BadRequest("Không có dữ liệu task cần cập nhật!");
    }
    if (
      inputFields.some(
        (field) => !UPDATE_FIELDS.has(field as keyof UpdateTaskRequest),
      )
    ) {
      throw new BadRequest("Dữ liệu chứa trường cập nhật không được hỗ trợ!");
    }

    const task = await this.getTaskOrThrow(task_id);
    const actor = await this.getActiveActor(actor_user_id, task.workspace_id);
    const isManager = MANAGER_ROLES.has(actor.role);

    if (!isManager) {
      if (actor.role !== WorkSpaceMemberRole.MEMBER) {
        throw new Authorization("Bạn không có quyền cập nhật task này!");
      }
      if (!task.member_ids.includes(actor.id)) {
        throw new Authorization(
          "Bạn chỉ được cập nhật task được giao cho mình!",
        );
      }
      if (inputFields.length !== 1 || inputFields[0] !== "status") {
        throw new Authorization("Member chỉ được cập nhật trạng thái task!");
      }
      if (!dto.status || !MEMBER_ALLOWED_STATUSES.has(dto.status)) {
        throw new Authorization(
          "Member chỉ được cập nhật trạng thái task đến mức review!",
        );
      }
    }

    const updateData: UpdateTaskData = {};
    if (dto.title !== undefined) {
      updateData.title = this.validateText(dto.title, "Tiêu đề");
    }
    if (dto.description !== undefined) {
      updateData.description = this.validateText(dto.description, "Mô tả");
    }
    if (dto.priority !== undefined) {
      updateData.priority = this.validatePriority(dto.priority);
    }
    if (dto.status !== undefined) {
      if (!Object.values(TaskStatus).includes(dto.status)) {
        throw new BadRequest("Trạng thái task không hợp lệ!");
      }
      updateData.status = dto.status;
    }

    const start_at =
      dto.start_at === undefined
        ? new Date(task.start_at)
        : this.parseDate(dto.start_at, "Thời gian bắt đầu");
    const end_at =
      dto.end_at === undefined
        ? new Date(task.end_at)
        : this.parseDate(dto.end_at, "Thời gian kết thúc");

    if (dto.start_at !== undefined && start_at.getTime() < Date.now()) {
      throw new BadRequest("Thời gian bắt đầu không được nằm trong quá khứ!");
    }
    if (end_at.getTime() <= start_at.getTime()) {
      throw new BadRequest("Thời gian kết thúc phải sau thời gian bắt đầu!");
    }
    if (dto.start_at !== undefined) updateData.start_at = start_at;
    if (dto.end_at !== undefined) updateData.end_at = end_at;

    const updatedTask = await this.taskRepository.updateTask(
      task.id,
      updateData,
    );
    if (!updatedTask) {
      throw new NotFound("Task không tồn tại!");
    }
    return updatedTask;
  };

  deleteTask = async (
    actor_id: string,
    task_id: string,
    workspace_id: string,
  ) => {
    const actor = await this.getActiveActor(actor_id, workspace_id);

    const task = await this.getTaskOrThrow(task_id);
    const isManager = MANAGER_ROLES.has(actor.role);

    if (!isManager) {
      throw new Authorization("Bạn không có quyền thực hiện việc này!");
    }

    const deletedTask = await this.taskRepository.deleteMember(
      task_id,
      workspace_id,
    );
  };
}

export default TaskService;
