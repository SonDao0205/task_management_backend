export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  OVERDUE = "overdue",
  COMPLETED = "done",
  REJECTED = "rejected",
  IN_REVIEW = "in_review",
  REVIEW = "review",
  BUG = "bug",
}

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: number;
  start_at: Date;
  end_at: Date;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  workspace_id: string;
};

export type AssignTask = {
  id: string;
  member_id: string;
  task_id: string;
};

export type TaskWithAssignees = Task & {
  member_ids: string[];
};
