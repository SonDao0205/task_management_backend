import type { User } from "./user.types.js";

export enum WorkSpaceStatus {
  ACTIVE = "active",
  IN_ACTIVE = "inactive",
}

export enum WorkSpaceMemberRole {
  OWNER = "owner",
  MEMBER = "member",
  MASTER = "master",
}

export enum WorkSpaceMemberStatus {
  ACTIVE = "active",
  IN_ACTIVE = "inactive",
  BANNED = "banned",
}

export type WorkSpace = {
  id: string;
  name: string;
  description: string | null;
  status: WorkSpaceStatus;
  created_at: Date;
  updated_at: Date | null;
};

export type WorkSpaceMemberDto = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: WorkSpaceMemberRole;
  status: WorkSpaceMemberStatus;
  joined_at: Date;
};

export type WorkSpaceSummary = WorkSpace & {
  role: WorkSpaceMemberRole;
  member_count: number;
  task_count: number;
  members: WorkSpaceMemberDto[];
};

export type WorkSpaceDetail = WorkSpaceSummary;

export type WorkSpaceMember = {
  member: User;
  workspace: WorkSpace;
  role: string;
  status: string;
  joined_at: Date;
  created_at: Date;
  updated_at: Date | null;
};

/** Dạng dữ liệu phẳng được trả về trực tiếp từ bảng workspace_members. */
export type WorkSpaceMemberRecord = {
  id: string;
  role: WorkSpaceMemberRole;
  status: WorkSpaceMemberStatus;
  member_id: string;
  workspace_id: string;
};
