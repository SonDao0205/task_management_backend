import type { TaskStatus } from "../../entity/task.types.js";

export type CreateTaskRequest = {
  title: string;
  description: string;
  priority: number;
  start_at: Date | string;
  end_at: Date | string;
  status: TaskStatus;
  workspace_id: string;
  /** IDs của bảng workspace_members, không phải users.id. */
  member_ids?: string[];
};

export type CreateTaskData = Omit<CreateTaskRequest, "member_ids"> & {
  start_at: Date;
  end_at: Date;
  created_by: string;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string;
  priority?: number;
  start_at?: Date | string;
  end_at?: Date | string;
  status?: TaskStatus;
};

export type AssignTaskMember = {
  /** Hỗ trợ assign/unassign một hoặc nhiều workspace_members. */
  member_ids: string[];
};

export type UpdateTaskData = {
  title?: string;
  description?: string;
  priority?: number;
  start_at?: Date;
  end_at?: Date;
  status?: TaskStatus;
};
