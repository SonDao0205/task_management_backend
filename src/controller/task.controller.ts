import type { Request, Response } from "express";
import TaskService from "../service/task.service.js";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type {
  AssignTask,
  Task,
  TaskListItem,
  TaskWithAssignees,
} from "../types/entity/task.types.js";

class TaskController {
  private static instance: TaskController;
  private readonly taskService: TaskService;

  constructor() {
    this.taskService = TaskService.getInstance();
  }

  public static getInstance = (): TaskController => {
    if (!TaskController.instance) {
      TaskController.instance = new TaskController();
    }
    return this.instance;
  };

  getWorkspaceTasks = async (
    req: Request,
    res: Response<ApiResponseData<TaskListItem[]>>,
  ) => {
    const data = await this.taskService.getWorkspaceTasks(
      String(req.params.workspaceId),
      String(req.auth?.user_id),
    );
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách task thành công!",
      data,
    });
  };

  getMyTasks = async (
    req: Request,
    res: Response<ApiResponseData<TaskListItem[]>>,
  ) => {
    const data = await this.taskService.getMyTasks(String(req.auth?.user_id));
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách task của bạn thành công!",
      data,
    });
  };

  getById = async (
    req: Request,
    res: Response<ApiResponseData<TaskListItem>>,
  ) => {
    const data = await this.taskService.getTask(
      String(req.params.taskId),
      String(req.auth?.user_id),
    );
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin task thành công!",
      data,
    });
  };

  create = async (
    req: Request,
    res: Response<ApiResponseData<TaskWithAssignees>>,
  ) => {
    const task = await this.taskService.createTask(
      req.body,
      String(req.auth?.user_id),
    );

    return res.status(201).json({
      success: true,
      message: "Tạo task thành công!",
      data: task,
    });
  };

  update = async (req: Request, res: Response<ApiResponseData<Task>>) => {
    const task = await this.taskService.updateTask(
      String(req.params.taskId),
      req.body,
      String(req.auth?.user_id),
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật task thành công!",
      data: task,
    });
  };

  assignMembers = async (
    req: Request,
    res: Response<ApiResponseData<AssignTask[]>>,
  ) => {
    const assignments = await this.taskService.assignMembers(
      String(req.params.taskId),
      req.body?.member_ids,
      String(req.auth?.user_id),
    );

    return res.status(201).json({
      success: true,
      message: "Giao task cho thành viên thành công!",
      data: assignments,
    });
  };

  unassignMembers = async (
    req: Request,
    res: Response<ApiResponseData<AssignTask[]>>,
  ) => {
    const assignments = await this.taskService.unassignMembers(
      String(req.params.taskId),
      req.body?.member_ids,
      String(req.auth?.user_id),
    );

    return res.status(200).json({
      success: true,
      message: "Bỏ giao task cho thành viên thành công!",
      data: assignments,
    });
  };

  deleteTask = async (req: Request, res: Response<ApiResponseData<null>>) => {
    await this.taskService.deleteTask(
      String(req.auth?.user_id),
      String(req.params.taskId),
    );

    return res.status(200).json({
      success: true,
      message: "Xoá task thành công!",
      data: null,
    });
  };

  deleteTaskLegacy = async (
    req: Request,
    res: Response<ApiResponseData<null>>,
  ) => {
    await this.taskService.deleteTask(
      String(req.auth?.user_id),
      String(req.params.taskId),
      String(req.params.workspaceId),
    );
    return res.status(200).json({
      success: true,
      message: "Xoá task thành công!",
      data: null,
    });
  };
}

export default TaskController;
