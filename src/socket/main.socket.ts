import type { Server } from "socket.io";
import { BadConnection } from "../exception/errors.js";
import type {
  CommentData,
  WorkspaceData,
} from "../types/entity/socket.data.types.js";
import WorkspaceHandler from "./workspace.handler.js";
import CommentHandler from "./comment.handler.js";
import type { MessageRequest } from "../types/dto/req/message.request.js";
import MessageHandler from "./message.handler.js";
import { userRoom } from "./rooms.js";

const workspaceHandler = WorkspaceHandler.getInstance();
const commentHandler = CommentHandler.getInstance();
const messageHandler = MessageHandler.getInstance();

export const mainSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Client Kết nối thành công : ", socket.id);
    const userId = String(socket.data.userId);
    void socket.join(userRoom(userId));

    void messageHandler.joinUserGroups(socket).catch((error: unknown) => {
      console.error("Không thể tham gia các room chat:", error);
    });

    // Đăng ký socket khi vào workspace để đọc comment
    socket.on("join-workspace", async (data: WorkspaceData) => {
      await workspaceHandler.joinWorkspace(data, socket);
    });

    // Huỷ Đăng ký socket khi rời workspace
    socket.on("leave-workspace", async (data: WorkspaceData) => {
      await workspaceHandler.leaveWorkspace(data, socket);
    });

    // Lắng nghe comment mới
    socket.on("commented", async (data: CommentData) => {
      const newComment = await commentHandler.newComment(data, io);
    });

    socket.on("join-group", async (data: { group_chat_id: string }) => {
      try {
        await messageHandler.joinGroup(data.group_chat_id, socket);
      } catch (error) {
        socket.emit("chat:error", {
          message:
            error instanceof Error
              ? error.message
              : "Không thể tham gia group chat!",
        });
      }
    });

    // Lưu và phát tin nhắn mới cho các thành viên trong group chat.
    socket.on("newMessage", async (data: MessageRequest) => {
      try {
        await messageHandler.newMessage(data, socket, io);
      } catch (error) {
        socket.emit("chat:error", {
          message:
            error instanceof Error ? error.message : "Không thể gửi tin nhắn!",
        });
      }
    });

    // TODO : Lắng nghe thông báo khi có người vào / ra khỏi groupchat
    socket.on("addMember", async () => {});

    socket.on("deleteMember", async () => {});

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
