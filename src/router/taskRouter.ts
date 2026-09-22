import { Router } from "express";
import TaskController from "../controller/task.controller.js";

export const taskRouter = Router();
const taskController = TaskController.getInstance();
