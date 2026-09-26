import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../config/database.js";
import { BadRequest, NotFound } from "../exception/errors.js";
import type {
  CreateTaskData,
  UpdateTaskData,
} from "../types/dto/req/task.request.js";
import type {
  AssignTask,
  Task,
  TaskWithAssignees,
} from "../types/entity/task.types.js";
import type { WorkSpaceMemberRecord } from "../types/entity/workspace.types.js";

const constraintMessages: Record<string, string> = {
  priority_check: "Độ ưu tiên phải nằm trong khoảng từ 1 đến 5!",
  start_at_check: "Thời gian bắt đầu không hợp lệ!",
  end_at_check: "Thời gian kết thúc không hợp lệ!",
  status_check: "Trạng thái task không hợp lệ!",
  created_by_fk: "Người tạo không tồn tại trong workspace!",
  workspace_id_fk: "Workspace không tồn tại!",
  member_assign_fk: "Thành viên không tồn tại trong workspace!",
  task_assign_fk: "Task không tồn tại!",
};

class TaskRepository {
  private static instance: TaskRepository;

  public static getInstance = (): TaskRepository => {
    if (!TaskRepository.instance) {
      TaskRepository.instance = new TaskRepository();
    }
    return this.instance;
  };

  private throwDatabaseError = (error: unknown): never => {
    if (error instanceof Error && "constraint" in error) {
      const constraint = String(error.constraint);
      const details = "detail" in error ? error.detail : undefined;
      const message = constraintMessages[constraint];
      if (message) {
        throw new BadRequest(message, details);
      }
    }

    if (error instanceof Error && "code" in error && error.code === "22P02") {
      throw new BadRequest("ID không đúng định dạng!");
    }

    throw error;
  };

  getAllTask = async (workspace_id: string): Promise<Task[]> => {
    try {
      const query = `
        SELECT id,title,description,priority,start_at,end_at,status,
          created_at,updated_at,created_by,workspace_id
        FROM task
        WHERE workspace_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query<Task>(query, [workspace_id]);
      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findById = async (task_id: string): Promise<TaskWithAssignees | null> => {
    try {
      const query = `
        SELECT
          t.id,t.title,t.description,t.priority,t.start_at,t.end_at,t.status,
          t.created_at,t.updated_at,t.created_by,t.workspace_id,
          COALESCE(
            ARRAY(
              SELECT a.member_id
              FROM assign_task a
              WHERE a.task_id = t.id
              ORDER BY a.member_id
            ),
            ARRAY[]::uuid[]
          ) AS member_ids
        FROM task t
        WHERE t.id = $1
      `;

      const result = await pool.query<TaskWithAssignees>(query, [task_id]);
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findWorkspaceMemberByUser = async (
    user_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord | null> => {
    try {
      const query = `
        SELECT id, role, status, member_id, workspace_id
        FROM workspace_members
        WHERE member_id = $1 AND workspace_id = $2
      `;

      const result = await pool.query<WorkSpaceMemberRecord>(query, [
        user_id,
        workspace_id,
      ]);
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findWorkspaceMembersByIds = async (
    workspace_id: string,
    member_ids: string[],
  ): Promise<WorkSpaceMemberRecord[]> => {
    if (member_ids.length === 0) return [];

    try {
      const query = `
        SELECT id, role, status, member_id, workspace_id
        FROM workspace_members
        WHERE workspace_id = $1 AND id = ANY($2::uuid[])
      `;

      const result = await pool.query<WorkSpaceMemberRecord>(query, [
        workspace_id,
        member_ids,
      ]);
      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  private insertTask = async (
    dto: CreateTaskData,
    client?: PoolClient,
  ): Promise<Task> => {
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
      INSERT INTO task(
        id,title,description,priority,start_at,end_at,status,created_by,workspace_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id,title,description,priority,start_at,end_at,status,
        created_at,updated_at,created_by,workspace_id
    `;

    const values = [
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

    const executor = client ?? pool;
    const result = await executor.query<Task>(query, values);
    return result.rows[0]!;
  };

  createTask = async (dto: CreateTaskData): Promise<TaskWithAssignees> => {
    try {
      const task = await this.insertTask(dto);
      return { ...task, member_ids: [] };
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  private insertAssignments = async (
    client: PoolClient,
    task_id: string,
    member_ids: string[],
  ): Promise<AssignTask[]> => {
    const values: string[] = [];
    const placeholders = member_ids.map((member_id, index) => {
      const offset = index * 3;
      values.push(randomUUID(), member_id, task_id);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    });

    const query = `
      INSERT INTO assign_task(id, member_id, task_id)
      VALUES ${placeholders.join(", ")}
      RETURNING id, member_id, task_id
    `;

    const result = await client.query<AssignTask>(query, values);
    return result.rows;
  };

  createTaskWithMembers = async (
    dto: CreateTaskData,
    member_ids: string[],
  ): Promise<TaskWithAssignees> => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const task = await this.insertTask(dto, client);
      await this.insertAssignments(client, task.id, member_ids);
      await client.query("COMMIT");

      return { ...task, member_ids };
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  updateTask = async (
    task_id: string,
    dto: UpdateTaskData,
  ): Promise<Task | null> => {
    try {
      const allowedFields: (keyof UpdateTaskData)[] = [
        "title",
        "description",
        "priority",
        "start_at",
        "end_at",
        "status",
      ];
      const setClauses: string[] = [];
      const values: unknown[] = [];

      for (const field of allowedFields) {
        const value = dto[field];
        if (value !== undefined) {
          values.push(value);
          setClauses.push(`${field} = $${values.length}`);
        }
      }

      if (setClauses.length === 0) return null;

      values.push(task_id);
      const query = `
        UPDATE task
        SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING id,title,description,priority,start_at,end_at,status,
          created_at,updated_at,created_by,workspace_id
      `;

      const result = await pool.query<Task>(query, values);
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  assignMembers = async (
    task_id: string,
    member_ids: string[],
  ): Promise<AssignTask[]> => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const taskResult = await client.query<{ id: string }>(
        "SELECT id FROM task WHERE id = $1 FOR UPDATE",
        [task_id],
      );
      if (!taskResult.rows[0]) {
        throw new NotFound("Task không tồn tại!");
      }

      const assignedResult = await client.query<{ member_id: string }>(
        `
          SELECT member_id
          FROM assign_task
          WHERE task_id = $1 AND member_id = ANY($2::uuid[])
        `,
        [task_id, member_ids],
      );
      if (assignedResult.rows.length > 0) {
        throw new BadRequest(
          `Thành viên đã được giao task: ${assignedResult.rows
            .map(({ member_id }) => member_id)
            .join(", ")}`,
        );
      }

      const assignments = await this.insertAssignments(
        client,
        task_id,
        member_ids,
      );
      await client.query("COMMIT");
      return assignments;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  unassignMembers = async (
    task_id: string,
    member_ids: string[],
  ): Promise<AssignTask[]> => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const taskResult = await client.query<{ id: string }>(
        "SELECT id FROM task WHERE id = $1 FOR UPDATE",
        [task_id],
      );
      if (!taskResult.rows[0]) {
        throw new NotFound("Task không tồn tại!");
      }

      const result = await client.query<AssignTask>(
        `
          DELETE FROM assign_task
          WHERE task_id = $1 AND member_id = ANY($2::uuid[])
          RETURNING id, member_id, task_id
        `,
        [task_id, member_ids],
      );

      if (result.rows.length !== member_ids.length) {
        throw new NotFound(
          "Một hoặc nhiều thành viên chưa được giao task này!",
        );
      }

      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  deleteMember = async (task_id: string, workspace_id: string) => {
    const query = `
    DELETE FROM task
    WHERE workspace_id = $1 AND id = $2
    `;

    const value = [workspace_id, task_id];

    const result = await pool.query(query, value);
  };
}

export default TaskRepository;
