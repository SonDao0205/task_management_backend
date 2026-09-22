import { Router } from "express";
import WorkSpaceController from "../controller/workspace.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const workspaceRouter = Router();
const workspaceController = WorkSpaceController.getInstance();
workspaceRouter.get("/workspaces", authenticate, workspaceController.getAll);
workspaceRouter.post(
  "/workspaces",
  authenticate,
  workspaceController.createWorkspace,
);
workspaceRouter.post(
  "/workspaces/add-member",
  authenticate,
  workspaceController.addMemberToWorkspace,
);

workspaceRouter.patch(
  "/workspaces/member/:memberId/:workspaceId",
  authenticate,
  workspaceController.updateMember,
);

workspaceRouter.delete(
  "/workspaces/member/delete/:memberId/:workspaceId",
  authenticate,
  workspaceController.deleteMemberToWorkspace,
);
