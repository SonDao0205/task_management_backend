import { randomUUID } from "node:crypto";
import { pool } from "../config/database.js";
import { BadRequest } from "../exception/errors.js";

class MessageRepository {
  private static instance: MessageRepository;

  public static getInstance = () => {
    if (!MessageRepository.instance) {
      MessageRepository.instance = new MessageRepository();
    }
    return MessageRepository.instance;
  };

  private throwDatabaseError = (error: unknown): never => {
    if (error instanceof Error && "constraint" in error) {
      const constraint = String(error.constraint);
      const details = "detail" in error ? error.detail : undefined;

      if (constraint === "created_by_fk") {
        throw new BadRequest("Người dùng không tồn tại!", details);
      }
      if (constraint === "group_fk") {
        throw new BadRequest("Group không tồn tại!", details);
      }
    }

    if (error instanceof Error && "code" in error && error.code === "22P02") {
      throw new BadRequest("ID không đúng định dạng!");
    }

    throw error;
  };

  getMessages = async (groupId: string, limit: number, offset: number) => {
    try {
      const query = `
        SELECT
          m.*,
          to_jsonb(u) AS created_by_info,
          to_jsonb(g) AS group_info
        FROM message AS m
        JOIN users AS u ON u.id = m.created_by
        JOIN group_chat AS g ON g.id = m.group_id
        WHERE m.group_id = $1
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT $2 OFFSET $3;
      `;

      const value = [groupId, limit, offset];

      const result = await pool.query(query, value);

      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  getLatestMessage = async (groupId: string) => {
    try {
      const query = `
        SELECT
        m.*,
        to_jsonb(u) AS created_by_info,
        to_jsonb(g) AS group_info
        FROM message AS m
        JOIN users AS u ON u.id = m.created_by
        JOIN group_chat AS g ON g.id = m.group_id
        WHERE m.group_id = $1
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1;
        `;

      const value = [groupId];

      const result = await pool.query(query, value);

      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  createMessage = async (
    content: string,
    created_by_id: string,
    group_chat_id: string,
  ) => {
    try {
      const query = `
        WITH inserted AS (
          INSERT INTO message (id, content, created_by, group_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        )
        SELECT
          i.*,
          to_jsonb(u) AS created_by_info,
          to_jsonb(g) AS group_info
        FROM inserted AS i
        JOIN users AS u ON u.id = i.created_by
        JOIN group_chat AS g ON g.id = i.group_id;
      `;

      const value = [randomUUID(), content, created_by_id, group_chat_id];

      const result = await pool.query(query, value);

      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };
}

export default MessageRepository;
