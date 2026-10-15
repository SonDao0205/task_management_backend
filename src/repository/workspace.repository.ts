import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../config/database.js";
import { BadRequest } from "../exception/errors.js";
import type {
  WorkSpaceMemberRequest,
  WorkSpaceRequest,
  WorkSpaceUpdateRequest,
} from "../types/dto/req/workspace.request.js";
import {
  WorkSpaceMemberRole,
  WorkSpaceMemberStatus,
  type WorkSpace,
  type WorkSpaceDetail,
  type WorkSpaceMemberDto,
  type WorkSpaceMemberRecord,
  type WorkSpaceSummary,
} from "../types/entity/workspace.types.js";
import GroupRepository from "./group.repository.js";
import { getSocketServer } from "../socket/runtime.js";
import { groupRoom, userRoom } from "../socket/rooms.js";

const workspaceSelect = `
  SELECT
    w.id, w.name, w.description, w.status, w.created_at, w.updated_at,
    actor.role,
    (SELECT COUNT(*)::int FROM workspace_members count_member
      WHERE count_member.workspace_id = w.id) AS member_count,
    (SELECT COUNT(*)::int FROM task count_task
      WHERE count_task.workspace_id = w.id) AS task_count,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', member.id,
            'user_id', member.member_id,
            'name', users.name,
            'email', users.email,
            'phone', users.phone,
            'role', member.role,
            'status', member.status,
            'joined_at', member.joined_at
          ) ORDER BY member.joined_at
        )
        FROM workspace_members member
        JOIN users ON users.id = member.member_id
        WHERE member.workspace_id = w.id
      ),
      '[]'::jsonb
    ) AS members
  FROM workspace w
  JOIN workspace_members actor ON actor.workspace_id = w.id
`;

class WorkSpaceRepository {
  private static instance: WorkSpaceRepository;
  private groupRepository: GroupRepository;

  constructor() {
    this.groupRepository = GroupRepository.getInstance();
  }

  public static getInstance = (): WorkSpaceRepository => {
    if (!WorkSpaceRepository.instance) {
      WorkSpaceRepository.instance = new WorkSpaceRepository();
    }
    return WorkSpaceRepository.instance;
  };

  private throwDatabaseError = (error: unknown): never => {
    if (error instanceof Error && "constraint" in error) {
      const constraint = String(error.constraint);
      const details = "detail" in error ? error.detail : undefined;

      if (constraint === "exist_member") {
        throw new BadRequest("Người dùng đã tồn tại trong workspace!", details);
      }
      if (constraint === "status" || constraint === "status_check") {
        throw new BadRequest("Trạng thái không hợp lệ!", details);
      }
      if (constraint === "role_check") {
        throw new BadRequest("Quyền hạn không hợp lệ!", details);
      }
      if (constraint === "member_fk") {
        throw new BadRequest("Người dùng không tồn tại!", details);
      }
      if (constraint === "workspace_fk") {
        throw new BadRequest("Workspace không tồn tại!", details);
      }
    }

    if (error instanceof Error && "code" in error && error.code === "22P02") {
      throw new BadRequest("ID không đúng định dạng!");
    }

    throw error;
  };

  findAllByUser = async (user_id: string): Promise<WorkSpaceSummary[]> => {
    try {
      const result = await pool.query<WorkSpaceSummary>(
        `${workspaceSelect}
         WHERE actor.member_id = $1 AND actor.status = 'active'
         ORDER BY COALESCE(w.updated_at, w.created_at) DESC`,
        [user_id],
      );
      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findByIdForUser = async (
    workspace_id: string,
    user_id: string,
  ): Promise<WorkSpaceDetail | null> => {
    try {
      const result = await pool.query<WorkSpaceDetail>(
        `${workspaceSelect}
         WHERE w.id = $1 AND actor.member_id = $2 AND actor.status = 'active'`,
        [workspace_id, user_id],
      );
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findMembershipByUser = async (
    user_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord | null> => {
    try {
      const result = await pool.query<WorkSpaceMemberRecord>(
        `SELECT id, role, status, member_id, workspace_id
         FROM workspace_members
         WHERE member_id = $1 AND workspace_id = $2`,
        [user_id, workspace_id],
      );
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findMembershipById = async (
    membership_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord | null> => {
    try {
      const result = await pool.query<WorkSpaceMemberRecord>(
        `SELECT id, role, status, member_id, workspace_id
         FROM workspace_members
         WHERE id = $1 AND workspace_id = $2`,
        [membership_id, workspace_id],
      );
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  getMembers = async (workspace_id: string): Promise<WorkSpaceMemberDto[]> => {
    try {
      const result = await pool.query<WorkSpaceMemberDto>(
        `SELECT
           wm.id, wm.member_id AS user_id, users.name, users.email, users.phone,
           wm.role, wm.status, wm.joined_at
         FROM workspace_members wm
         JOIN users ON users.id = wm.member_id
         WHERE wm.workspace_id = $1
         ORDER BY wm.joined_at`,
        [workspace_id],
      );
      return result.rows;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  findUserIdByEmail = async (email: string): Promise<string | null> => {
    const result = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    return result.rows[0]?.id ?? null;
  };

  private createWorkspace = async (
    client: PoolClient,
    dto: WorkSpaceRequest,
  ): Promise<WorkSpace> => {
    const result = await client.query<WorkSpace>(
      `INSERT INTO workspace(id, name, description, status)
       VALUES ($1, $2, $3, COALESCE($4, 'active'))
       RETURNING id, name, description, status, created_at, updated_at`,
      [randomUUID(), dto.name, dto.description ?? null, dto.status ?? null],
    );
    return result.rows[0]!;
  };

  createWorkspaceWithOwner = async (
    workspaceDto: WorkSpaceRequest,
    workspaceMemberDto: WorkSpaceMemberRequest,
  ): Promise<WorkSpace> => {
    const groupRepository = GroupRepository.getInstance();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const workspace = await this.createWorkspace(client, workspaceDto);

      await client.query(
        `INSERT INTO workspace_members(id, role, status, member_id, workspace_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          workspaceMemberDto.role,
          workspaceMemberDto.status,
          workspaceMemberDto.member_id,
          workspace.id,
        ],
      );

      const group = await groupRepository.createGroupChat(
        workspace.name,
        workspace.id,
        client,
      );
      await groupRepository.addMemberToGroup(
        group.id,
        workspaceMemberDto.member_id,
        client,
      );

      await client.query("COMMIT");
      return workspace;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  updateWorkspace = async (
    workspace_id: string,
    dto: WorkSpaceUpdateRequest,
  ): Promise<WorkSpace | null> => {
    const fields: (keyof WorkSpaceUpdateRequest)[] = [
      "name",
      "description",
      "status",
    ];
    const values: unknown[] = [];
    const setClauses: string[] = [];

    for (const field of fields) {
      if (dto[field] !== undefined) {
        values.push(dto[field]);
        setClauses.push(`${field} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) return null;
    values.push(workspace_id);

    try {
      const result = await pool.query<WorkSpace>(
        `UPDATE workspace
         SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length}
         RETURNING id, name, description, status, created_at, updated_at`,
        values,
      );
      return result.rows[0] ?? null;
    } catch (error) {
      return this.throwDatabaseError(error);
    }
  };

  deleteWorkspace = async (workspace_id: string): Promise<boolean> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM assign_task
         WHERE task_id IN (SELECT id FROM task WHERE workspace_id = $1)`,
        [workspace_id],
      );
      await client.query("DELETE FROM task WHERE workspace_id = $1", [
        workspace_id,
      ]);
      await client.query(
        "DELETE FROM workspace_members WHERE workspace_id = $1",
        [workspace_id],
      );
      const result = await client.query(
        "DELETE FROM workspace WHERE id = $1 RETURNING id",
        [workspace_id],
      );
      await client.query("COMMIT");
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  addMemberToWorkspace = async (
    dto: WorkSpaceMemberRequest,
  ): Promise<WorkSpaceMemberRecord> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<WorkSpaceMemberRecord>(
        `INSERT INTO workspace_members(id, role, status, member_id, workspace_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, role, status, member_id, workspace_id`,
        [randomUUID(), dto.role, dto.status, dto.member_id, dto.workspace_id],
      );
      const groups =
        dto.status === WorkSpaceMemberStatus.ACTIVE
          ? await client.query<{ id: string }>(
              "SELECT id FROM group_chat WHERE workspace_id = $1",
              [dto.workspace_id],
            )
          : { rows: [] as { id: string }[] };
      for (const group of groups.rows) {
        await this.groupRepository.addMemberToGroup(
          group.id,
          dto.member_id,
          client,
        );
      }
      await client.query("COMMIT");
      if (dto.status === WorkSpaceMemberStatus.ACTIVE) {
        await this.updateSocketGroupAccess(
          dto.member_id,
          groups.rows.map(({ id }) => id),
          true,
        );
      }
      return result.rows[0]!;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  updateMember = async (
    member_id: string,
    workspace_id: string,
    status: WorkSpaceMemberStatus,
    role: WorkSpaceMemberRole,
  ): Promise<WorkSpaceMemberRecord | null> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM workspace WHERE id = $1 FOR UPDATE", [
        workspace_id,
      ]);
      const groups = await client.query<{ id: string }>(
        "SELECT id FROM group_chat WHERE workspace_id = $1",
        [workspace_id],
      );
      const result = await client.query<WorkSpaceMemberRecord>(
        `UPDATE workspace_members
         SET status = $3, role = $4, updated_at = CURRENT_TIMESTAMP
         WHERE member_id = $1 AND workspace_id = $2
         RETURNING id, role, status, member_id, workspace_id`,
        [member_id, workspace_id, status, role],
      );
      if (result.rows[0]) {
        for (const group of groups.rows) {
          if (status === WorkSpaceMemberStatus.ACTIVE) {
            await client.query(
              `INSERT INTO group_members(id, member_id, group_id)
               SELECT $1, $2, $3
               WHERE NOT EXISTS (
                 SELECT 1 FROM group_members
                 WHERE member_id = $2 AND group_id = $3
               )`,
              [randomUUID(), member_id, group.id],
            );
          } else {
            await client.query(
              "DELETE FROM group_members WHERE member_id = $1 AND group_id = $2",
              [member_id, group.id],
            );
          }
        }
      }
      await this.ensureOwner(client, workspace_id);
      await client.query("COMMIT");
      if (result.rows[0]) {
        await this.updateSocketGroupAccess(
          member_id,
          groups.rows.map(({ id }) => id),
          status === WorkSpaceMemberStatus.ACTIVE,
        );
      }
      return result.rows[0] ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  deleteMember = async (
    member_id: string,
    workspace_id: string,
  ): Promise<WorkSpaceMemberRecord | null> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM workspace WHERE id = $1 FOR UPDATE", [
        workspace_id,
      ]);
      const groups = await client.query<{ id: string }>(
        "SELECT id FROM group_chat WHERE workspace_id = $1",
        [workspace_id],
      );
      await client.query(
        `DELETE FROM group_members gm
         USING group_chat gc
         WHERE gm.group_id = gc.id
           AND gc.workspace_id = $2
           AND gm.member_id = $1`,
        [member_id, workspace_id],
      );
      const result = await client.query<WorkSpaceMemberRecord>(
        `DELETE FROM workspace_members
         WHERE member_id = $1 AND workspace_id = $2
         RETURNING id, role, status, member_id, workspace_id`,
        [member_id, workspace_id],
      );
      await this.ensureOwner(client, workspace_id);
      await client.query("COMMIT");
      if (result.rows[0]) {
        await this.updateSocketGroupAccess(
          member_id,
          groups.rows.map(({ id }) => id),
          false,
        );
      }
      return result.rows[0] ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      return this.throwDatabaseError(error);
    } finally {
      client.release();
    }
  };

  private ensureOwner = async (
    client: PoolClient,
    workspace_id: string,
  ): Promise<void> => {
    const result = await client.query<{ has_owner: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM workspace_members
         WHERE workspace_id = $1 AND role = $2
       ) AS has_owner`,
      [workspace_id, WorkSpaceMemberRole.OWNER],
    );
    if (!result.rows[0]?.has_owner) {
      throw new BadRequest("Workspace phải có ít nhất một owner!");
    }
  };

  private updateSocketGroupAccess = async (
    user_id: string,
    group_ids: string[],
    can_join: boolean,
  ) => {
    if (group_ids.length === 0) return;
    const server = getSocketServer();
    if (!server) return;
    const userSockets = server.in(userRoom(user_id));
    const rooms = group_ids.map(groupRoom);
    try {
      if (can_join) {
        await userSockets.socketsJoin(rooms);
      } else {
        await userSockets.socketsLeave(rooms);
      }
    } catch (error) {
      console.error("Không thể đồng bộ quyền truy cập room chat:", error);
    }
  };
}

export default WorkSpaceRepository;
