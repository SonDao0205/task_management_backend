import type { Request, Response } from "express";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type { Task } from "../types/entity/task.types.js";

class TaskController {
  private static instance: TaskController;
  public static getInstance = (): TaskController => {
    if (!TaskController.instance) {
      TaskController.instance = new TaskController();
    }
    return this.instance;
  };

  getAll = async (req: Request, res: Response<ApiResponseData<Task[]>>) => {};
}

export default TaskController;
