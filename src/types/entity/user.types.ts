import type { UUID } from "node:crypto";

export enum UserStatus {
  ACTIVE = "active",
  IN_ACTIVE = "inactive",
  BANNED = "banned",
}

export type UserTokenPayload = {
  user_id: string;
};

export type User = {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  refresh_token: string;
  created_at: Date;
  updated_at: Date;
};

export type UserSession = {
  id: UUID;
  user_id: UUID;
  access_token: string;
  refresh_token: string;
  created_at: Date;
};

export type UserWithPassword = User & {
  password: string;
};
