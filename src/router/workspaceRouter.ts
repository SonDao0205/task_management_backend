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

workspaceRouter.get(
  "/workspaces/:workspaceId",
  authenticate,
  workspaceController.getById,
);
workspaceRouter.patch(
  "/workspaces/:workspaceId",
  authenticate,
  workspaceController.updateWorkspace,
);
workspaceRouter.delete(
  "/workspaces/:workspaceId",
  authenticate,
  workspaceController.deleteWorkspace,
);
workspaceRouter.get(
  "/workspaces/:workspaceId/members",
  authenticate,
  workspaceController.getMembers,
);
workspaceRouter.post(
  "/workspaces/:workspaceId/members",
  authenticate,
  workspaceController.addMember,
);
workspaceRouter.patch(
  "/workspaces/:workspaceId/members/:memberId",
  authenticate,
  workspaceController.updateMember,
);
workspaceRouter.delete(
  "/workspaces/:workspaceId/members/:memberId",
  authenticate,
  workspaceController.deleteMember,
);
