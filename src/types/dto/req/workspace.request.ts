import type {
  WorkSpaceMemberRole,
  WorkSpaceMemberStatus,
  WorkSpaceStatus,
} from "../../entity/workspace.types.js";

export type WorkSpaceRequest = {
  name: string;
  description?: string;
  status?: WorkSpaceStatus;
};

export type WorkSpaceMemberRequest = {
  role: WorkSpaceMemberRole;
  status: WorkSpaceMemberStatus;
  member_id: string;
  workspace_id?: string;
};
