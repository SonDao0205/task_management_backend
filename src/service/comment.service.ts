import { Authorization, BadRequest } from "../exception/errors.js";
import CommentRepository from "../repository/comment.repository.js";
import WorkSpaceRepository from "../repository/workspace.repository.js";
import type { CreateComment } from "../types/dto/req/comment.request.js";
import { WorkSpaceMemberStatus } from "../types/entity/workspace.types.js";
import TaskService from "./task.service.js";
import WorkSpaceService from "./workspace.service.js";

class CommentService {
  private static instance: CommentService;
  private commentRepository: CommentRepository;
  private workspaceService: WorkSpaceService;
  private taskService: TaskService;

  constructor() {
    this.workspaceService = WorkSpaceService.getInstance();
    this.commentRepository = CommentRepository.getInstance();
    this.taskService = TaskService.getInstance();
  }
  public static getInstance = () => {
    if (!CommentService.instance) {
      CommentService.instance = new CommentService();
    }
    return this.instance;
  };

  getAllComments = async (
    task_id: string,
    workspace_id: string,
    user_id: string,
  ) => {
    const membership = await this.workspaceService.getMembership(
      workspace_id,
      user_id,
    );

    const response =
      await this.commentRepository.getAllCommentByTaskAndWorkspace(
        task_id,
        workspace_id,
      );

    return response;
  };

  saveComment = async (dto: CreateComment) => {
    const { created_by, workspace_id, task_id, content, parent_id } = dto;

    if (content.trim().length <= 0) {
      throw new BadRequest("Nội dung không được bỏ trống!");
    }

    const workspace = await this.workspaceService.getById(
      workspace_id,
      created_by,
    );
    const task = await this.taskService.getTaskExist(task_id);

    const saved = await this.commentRepository.createComment(
      task_id,
      workspace_id,
      created_by,
      content,
      parent_id ?? null,
    );

    return saved;
  };

  getCommentById = (
    workspace_id: string,
    task_id: string,
    comment_id: string,
  ) => {
    const comment = this.commentRepository.findComment(
      task_id,
      workspace_id,
      comment_id,
    );

    if (!comment) {
      throw new BadRequest("Comment không tồn tại!");
    }
    return comment;
  };
}

export default CommentService;
