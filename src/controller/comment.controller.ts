import type { Request, Response } from "express";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type { Comment } from "../types/entity/comment.types.js";
import CommentService from "../service/comment.service.js";

class CommentController {
  private static instance: CommentController;
  private commentService: CommentService;

  constructor() {
    this.commentService = CommentService.getInstance();
  }

  public static getInstance = () => {
    if (!CommentController.instance) {
      CommentController.instance = new CommentController();
    }
    return this.instance;
  };

  getComments = async (
    req: Request,
    res: Response<ApiResponseData<Comment[]>>,
  ) => {
    const { taskId, workspaceId } = req.params;
    const userId = req.auth?.user_id;
    const response = await this.commentService.getAllComments(
      String(taskId),
      String(workspaceId),
      String(userId),
    );
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách comment thành công!",
      data: response,
    });
  };
}

export default CommentController;
