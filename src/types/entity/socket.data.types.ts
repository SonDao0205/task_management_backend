export type WorkspaceData = {
  user_id: string;
  workspace_id: string;
};

export type CommentData = {
  created_by: string;
  workspace_id: string;
  task_id: string;
  parent_id: string | null;
  content: string;
};
