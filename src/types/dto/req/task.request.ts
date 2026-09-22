import type { TaskStatus } from "../../entity/task.types.js";

export type CreateTaskRequest = {
  title: string;
  description: string;
  priority: number;
  start_at: Date;
  end_at: Date;
  status: string;
  created_by: string;
  workspace_id: string;
};
