import type { Server, Socket } from "socket.io";
import type { CommentData } from "../types/entity/socket.data.types.js";
import WorkSpaceService from "../service/workspace.service.js";
import TaskService from "../service/task.service.js";
import CommentService from "../service/comment.service.js";

class CommentHandler {
  private static instance: CommentHandler;
  private workspaceService: WorkSpaceService;
  private taskService: TaskService;
  private commentService: CommentService;

  constructor() {
    this.workspaceService = WorkSpaceService.getInstance();
    this.taskService = TaskService.getInstance();
    this.commentService = CommentService.getInstance();
  }

  public static getInstance = () => {
    if (!CommentHandler.instance) {
      CommentHandler.instance = new CommentHandler();
    }
    return this.instance;
  };

  newComment = async (data: CommentData, io: Server) => {
    const { created_by, workspace_id, task_id, content, parent_id } = data;

    const saved = await this.commentService.saveComment({
      created_by,
      workspace_id,
      task_id,
      content,
      parent_id,
    });

    io.in(workspace_id).emit("newComment", saved);

    return saved;
  };
}

export default CommentHandler;
