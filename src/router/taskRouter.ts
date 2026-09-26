import { Router } from "express";
import TaskController from "../controller/task.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const taskRouter = Router();
const taskController = TaskController.getInstance();

taskRouter.post("/tasks", authenticate, taskController.create);
taskRouter.patch("/tasks/:taskId", authenticate, taskController.update);
taskRouter.post(
  "/tasks/:taskId/assignees",
  authenticate,
  taskController.assignMembers,
);
taskRouter.delete(
  "/tasks/:taskId/assignees",
  authenticate,
  taskController.unassignMembers,
);

taskRouter.delete(
  "/tasks/:taskId/:workspaceId/delete",
  authenticate,
  taskController.deleteTask,
);
