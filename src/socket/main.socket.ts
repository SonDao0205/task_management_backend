import type { Server } from "socket.io";
import { BadConnection } from "../exception/errors.js";
import type {
  CommentData,
  WorkspaceData,
} from "../types/entity/socket.data.types.js";
import WorkspaceHandler from "./workspace.handler.js";
import CommentHandler from "./comment.handler.js";

const workspaceHandler = WorkspaceHandler.getInstance();
const commentHandler = CommentHandler.getInstance();

export const mainSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Client Kết nối thành công : ", socket.id);

    // Đăng ký socket khi vào workspace để đọc comment
    socket.on("join-workspace", async (data: WorkspaceData) => {
      const joinWorkspace = await workspaceHandler.joinWorkspace(data, socket);
    });

    // Huỷ Đăng ký socket khi rời workspace
    socket.on("leave-workspace", async (data: WorkspaceData) => {
      const leaveWorkspace = await workspaceHandler.leaveWorkspace(
        data,
        socket,
      );
    });

    // Lắng nghe comment mới
    socket.on("commented", async (data: CommentData) => {
      const newComment = await commentHandler.newComment(data, io);
    });

    // Kết nối socket lỗi
    socket.on("connect_error", () => {
      throw new BadConnection("Kết nối đến máy chủ thất bại!");
    });

    // Ngừng kết nối đến socket
    socket.on("disconnect", () => {
      console.log("Client ngắt kết nối : ", socket.id);
    });
  });
};
