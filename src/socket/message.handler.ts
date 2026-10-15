import { Socket, type Server } from "socket.io";
import type { MessageRequest } from "../types/dto/req/message.request.js";
import GroupService from "../service/group.service.js";
import { BadRequest } from "../exception/errors.js";
import MessageService from "../service/message.service.js";

class MessageHandler {
  private static instance: MessageHandler;
  private messageService: MessageService;

  constructor() {
    this.messageService = MessageService.getInstance();
  }

  public static getInstance = () => {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return this.instance;
  };

  newMessage = async (req: MessageRequest, socket: Socket) => {
    const messaged = await this.messageService.createMessage(req);

    socket.emit("newMessage", messaged);
  };
}

export default MessageHandler;
