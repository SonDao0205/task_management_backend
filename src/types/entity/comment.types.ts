import type { Task } from "./task.types.js";
import type { User } from "./user.types.js";
import type { WorkSpace } from "./workspace.types.js";

export type Comment = {
  id: string;
  workspace: WorkSpace;
  created_by: User;
  task: Task;
  content: string;
  parent: Comment;
  created_at: Date;
  userName: string;
};
