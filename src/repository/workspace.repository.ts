import { randomUUID, type UUID } from "node:crypto";
import { pool } from "../config/database.js";
import type {
  WorkSpaceMemberRequest,
  WorkSpaceRequest,
} from "../types/dto/req/workspace.request.js";
import {
  WorkSpaceMemberRole,
  type WorkSpace,
  type WorkSpaceMember,
} from "../types/entity/workspace.types.js";
import { BadRequest } from "../exception/errors.js";
import type { PoolClient } from "pg";

export class WorkSpaceRepository {
  private static instance: WorkSpaceRepository;

  constructor() {}

  public static getInstance = (): WorkSpaceRepository => {
    if (!WorkSpaceRepository.instance) {
      WorkSpaceRepository.instance = new WorkSpaceRepository();
    }
    return this.instance;
  };

  findAll = async (): Promise<WorkSpace[]> => {
    const query =
      "SELECT id,name,description,status,created_at,updated_at FROM workspace";
    const result = await pool.query(query);

    return result.rows;
  };

  createWorkspace = async (
    client: PoolClient,
    dto: WorkSpaceRequest,
  ): Promise<WorkSpace> => {
    const { name, description } = dto;
    const query = `
    INSERT INTO workspace(id,name,description) VALUES
    ($1,$2,$3)
    RETURNING id,name,description,status,created_at,updated_at
`;

    const value = [randomUUID(), name, description];
    const result = await client.query(query, value);
    return result.rows[0] ?? null;
  };

  addMemberToWorkspace = async (
    dto: WorkSpaceMemberRequest,
  ): Promise<WorkSpaceMember> => {
    const { role, status, member_id, workspace_id } = dto;

    const query = `
    INSERT INTO workspace_members(id,role,status,member_id,workspace_id) VALUES
    ($1,$2,$3,$4,$5)
    RETURNING id,role,status,joined_at,created_at,updated_at,member_id,workspace_id
    `;

    const value = [randomUUID(), role, status, member_id, workspace_id];

    const result = await pool.query(query, value);

    return result.rows[0] ?? null;
  };

  createWorkspaceWithOwner = async (
    workspaceDto: WorkSpaceRequest,
    workspaceMemberDto: WorkSpaceMemberRequest,
  ) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const workspace = await this.createWorkspace(client, workspaceDto);

      // create workspace member owner

      const { role, status, member_id } = workspaceMemberDto;
      const workspace_id = workspace.id;
      const query = `
        INSERT INTO workspace_members(id,role,status,member_id,workspace_id) VALUES
        ($1,$2,$3,$4,$5)
        RETURNING id,role,status,joined_at,created_at,updated_at,member_id,workspace_id
    `;

      const value = [randomUUID(), role, status, member_id, workspace_id];

      await client.query(query, value);

      await client.query("COMMIT");

      return workspace;
    } catch (error) {
      await client.query("ROLLBACK");
      console.log("Error : ", error);
      throw new BadRequest("Tạo Workspace thất bại!");
    } finally {
      client.release();
    }
  };

  isOwner = async (user_id: string, workspace_id: string) => {
    try {
      const query = `
    select member_id, workspace_id , role 
    from workspace_members
    where member_id = $1 AND workspace_id = $2 AND role = $3
    `;
      const value = [user_id, workspace_id, WorkSpaceMemberRole.OWNER];

      const result = await pool.query(query, value);

      return result.rows[0] ?? null;
    } catch (error) {
      console.log("Error : ", error);
    }
  };
}

export default WorkSpaceRepository;
