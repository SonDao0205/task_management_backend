import type { Server, Socket } from "socket.io";
import type { MessageRequest } from "../types/dto/req/message.request.js";
import GroupService from "../service/group.service.js";
import { Authorization } from "../exception/errors.js";
import MessageService from "../service/message.service.js";
import { groupRoom } from "./rooms.js";

class MessageHandler {
  private static instance: MessageHandler;
  private messageService: MessageService;
  private groupService: GroupService;

  constructor() {
    this.messageService = MessageService.getInstance();
    this.groupService = GroupService.getInstance();
  }

  public static getInstance = () => {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return this.instance;
  };

  joinUserGroups = async (socket: Socket) => {
    const groupIds = await this.groupService.getGroupIdsByUser(
      String(socket.data.userId),
    );
    await Promise.all(groupIds.map((groupId) => socket.join(groupRoom(groupId))));
  };

  joinGroup = async (groupChatId: string, socket: Socket) => {
    const userId = String(socket.data.userId);
    const isMember = await this.groupService.isExistInGroup(userId, groupChatId);
    if (!isMember) {
      throw new Authorization("Bạn không phải thành viên của group chat này!");
    }
    await socket.join(groupRoom(groupChatId));
  };

  newMessage = async (req: MessageRequest, socket: Socket, io: Server) => {
    const groupChatId = req.group_chat_id;
    await this.joinGroup(groupChatId, socket);

    const messaged = await this.messageService.createMessage({
      ...req,
      created_by_id: String(socket.data.userId),
    });

    io.to(groupRoom(groupChatId)).emit("newMessage", messaged);
  };
}

export default MessageHandler;
