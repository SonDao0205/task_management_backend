import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import CommentController from "../controller/comment.controller.js";

export const commentRouter = Router();
const commentController = CommentController.getInstance();

commentRouter.get(
  "/comments/:taskId/:workspaceId",
  authenticate,
  commentController.getComments,
);
