export type CreateComment = {
  created_by: string;
  workspace_id: string;
  task_id: string;
  content: string;
  parent_id: string | null;
};
