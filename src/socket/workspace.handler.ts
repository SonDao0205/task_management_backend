import type { Socket } from "socket.io";
import WorkSpaceService from "../service/workspace.service.js";
import type { WorkspaceData } from "../types/entity/socket.data.types.js";

class WorkspaceHandler {
  private static instance: WorkspaceHandler;
  private workspaceService: WorkSpaceService;

  constructor() {
    this.workspaceService = WorkSpaceService.getInstance();
  }

  public static getInstance = () => {
    if (!WorkspaceHandler.instance) {
      WorkspaceHandler.instance = new WorkspaceHandler();
    }
    return this.instance;
  };

  joinWorkspace = async (data: WorkspaceData, socket: Socket) => {
    const { user_id, workspace_id } = data;
    const workspace = await this.workspaceService.getById(
      workspace_id,
      user_id,
    );

    socket.join(workspace.id);
  };

  leaveWorkspace = async (data: WorkspaceData, socket: Socket) => {
    const { user_id, workspace_id } = data;
    const workspace = await this.workspaceService.getById(
      workspace_id,
      user_id,
    );

    socket.leave(workspace.id);
  };
}

export default WorkspaceHandler;
