import { randomUUID } from "node:crypto";
import { pool } from "../config/database.js";
import { BadRequest } from "../exception/errors.js";

class CommentRepository {
  private static instance: CommentRepository;
  public static getInstance = () => {
    if (!CommentRepository.instance) {
      CommentRepository.instance = new CommentRepository();
    }
    return this.instance;
  };

  private throwDatabaseError = (error: unknown): never => {
    if (error instanceof Error && "constraint" in error) {
      const constraint = String(error.constraint);
      const details = "detail" in error ? error.detail : undefined;

      if (constraint === "workspace_fk") {
        throw new BadRequest("Workspace không tồn tại!", details);
      }
      if (constraint === "created_by_fk") {
        throw new BadRequest("Người dùng không tồn tại!", details);
      }
      if (constraint === "task_fk") {
        throw new BadRequest("Task không tồn tại!", details);
      }
      if (constraint === "parent_fk") {
        throw new BadRequest("Parent comment không tồn tại!", details);
      }
    }

    if (error instanceof Error && "code" in error && error.code === "22P02") {
      throw new BadRequest("ID không đúng định dạng!");
    }

    throw error;
  };

  getAllCommentByTaskAndWorkspace = async (
    task_id: string,
    workspace_id: string,
  ) => {
    const query = `
            SELECT c.id, c.workspace_id , c.created_by , c.task_id , c.content , c.parent_id , c.created_at, u."name"
            FROM comments c
            join users u on u.id = c.created_by  
            WHERE task_id = $1 AND workspace_id = $2;
        `;

    const value = [task_id, workspace_id];

    const result = await pool.query(query, value);
    return result.rows;
  };

  createComment = async (
    task_id: string,
    workspace_id: string,
    created_by: string,
    content: string,
    parent_id: string | null,
  ) => {
    try {
      const query = `
        INSERT INTO comments(id,workspace_id,created_by,task_id,content,parent_id) VALUES
        ($1,$2,$3,$4,$5,$6)
        RETURNING id,workspace_id,created_by,task_id,content,parent_id,created_at
    `;

      const value = [
        randomUUID(),
        workspace_id,
        created_by,
        task_id,
        content,
        parent_id,
      ];

      const result = await pool.query(query, value);

      return result.rows[0];
    } catch (error) {
      this.throwDatabaseError(error);
    }
  };

  findComment = async (
    task_id: string,
    workspace_id: string,
    comment_id: string,
  ) => {
    try {
      const query = `
            SELECT id,workspace_id,created_by,task_id,content,parent_id,created_at
            FROM comments
            WHERE task_id = $1 AND workspace_id = $2 AND id = $3
        `;

      const value = [task_id, workspace_id, comment_id];
      const result = await pool.query(query, value);

      return result.rows[0];
    } catch (error) {
      this.throwDatabaseError(error);
    }
  };
}

export default CommentRepository;
