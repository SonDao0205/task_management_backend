import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { pool } from "../config/database.js";
import { BadRequest } from "../exception/errors.js";

class GroupRepository {
  private static instance: GroupRepository;

  public static getInstance = () => {
    if (!GroupRepository.instance) {
      GroupRepository.instance = new GroupRepository();
    }
    return GroupRepository.instance;
  };

  private throwDatabaseError = (error: unknown): never => {
    if (error instanceof Error && "constraint" in error) {
      const constraint = String(error.constraint);
      const details = "detail" in error ? error.detail : undefined;

      if (constraint === "workspace_fk") {
        throw new BadRequest("Workspace không tồn tại!", details);
      }
      if (constraint === "member_fk") {
        throw new BadRequest("Người dùng không tồn tại!", details);
      }
    }

    if (error instanceof Error && "code" in error && error.code === "22P02") {
      throw new BadRequest("ID không đúng định dạng!");
    }

    throw error;
  };

  getUserGroups = async (userId: string, limit: number, offset: number) => {
    try {
      const result = await pool.query(
        `SELECT gc.*
       FROM group_chat gc
       JOIN group_members gm ON gm.group_id = gc.id
       WHERE gm.member_id = $1
       LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );

      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  createGroupChat = async (
    name: string,
    workspaceId: string,
    db: PoolClient,
  ) => {
    try {
      const result = await db.query(
        `insert into group_chat (id, name, workspace_id)
         values ($1, $2, $3)
         returning *`,
        [randomUUID(), name, workspaceId],
      );
      return result.rows[0];
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  existGroupByWorkspace = async (workspaceId: string) => {
    try {
      const result = await pool.query(
        `select 1 from group_chat where workspace_id = $1`,
        [workspaceId],
      );
      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  addMemberToGroup = async (
    groupId: string,
    memberId: string,
    db: PoolClient,
  ) => {
    try {
      const result = await db.query(
        `insert into group_members (id, member_id, group_id)
         values ($1, $2, $3)
         returning *`,
        [randomUUID(), memberId, groupId],
      );
      return result.rows[0];
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  removeMemberToGroup = async (groupId: string, memberId: string) => {
    try {
      const result = await pool.query(
        `delete from group_members
         where member_id = $1 and group_id = $2`,
        [memberId, groupId],
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };
}

export default GroupRepository;
