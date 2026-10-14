import { Router } from "express";
import GroupController from "../controller/group.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const groupRouter = Router();
const groupController = GroupController.getInstance();

groupRouter.get(
  "/groups/:limit/:offset",
  authenticate,
  groupController.getGroups,
);
