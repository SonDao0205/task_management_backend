import TaskRepository from "../repository/task.repository.js";

class TaskService {
  private static instance: TaskService;
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = TaskRepository.getInstance();
  }

  public static getInstance = () => {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return this.instance;
  };

  getAllTask = async () => {
    const tasks = await this.taskRepository.getAllTask("123");
    return tasks;
  };
}

export default TaskService;
