import type { User } from "./user.types.js";
import type { WorkSpace, WorkSpaceMember } from "./workspace.types.js";

export type GroupChat = {
  id: string;
  name: string;
  workspace: WorkSpace;
  created_at: Date;
  updated_at: Date;
};

export type GroupMember = {
  id: string;
  member: WorkSpaceMember;
  group_chat: GroupChat;
  created_at: Date;
};

export type Message = {
  id: string;
  content: string;
  created_by: User;
  group_chat: GroupChat | null;
  created_at: Date;
};
