import { randomUUID } from "node:crypto";
import { pool } from "../config/database.js";
import type { CreateTaskRequest } from "../types/dto/req/task.request.js";

class TaskRepository {
  private static instance: TaskRepository;

  public static getInstance = (): TaskRepository => {
    if (!TaskRepository.instance) {
      TaskRepository.instance = new TaskRepository();
    }
    return this.instance;
  };

  getAllTask = async (workspace_id: string) => {
    const query = `
    SELECT id,title,description,priority,start_at,end_at,status,created_at,updated_at,created_by,workspace_id FROM task;
    `;

    const result = await pool.query(query);

    return result.rows ?? null;
  };

  createTask = async (dto: CreateTaskRequest) => {
    const {
      title,
      description,
      priority,
      start_at,
      end_at,
      status,
      created_by,
      workspace_id,
    } = dto;

    const query = `
    INSERT INTO task(id,title,description,priority , start_at, end_at,status, created_by,workspace_id) VALUES 
    ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id,title,description,priority,start_at,end_at,status,created_at,updated_at,created_by,workspace_id
    `;

    const value = [
      randomUUID(),
      title,
      description,
      priority,
      start_at,
      end_at,
      status,
      created_by,
      workspace_id,
    ];

    const result = await pool.query(query, value);

    return result.rows[0] ?? null;
  };
}

export default TaskRepository;
