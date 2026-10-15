import { Router } from "express";
import MessageController from "../controller/message.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const messageRouter = Router();
const messageController = MessageController.getInstance();

messageRouter.post(
  "/groups/messages",
  authenticate,
  messageController.getMessages,
);
