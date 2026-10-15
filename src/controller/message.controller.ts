import type { Request, Response } from "express";
import type { ApiResponseData } from "../types/dto/res/response.js";
import type { Message } from "../types/entity/group_chat.types.js";
import MessageService from "../service/message.service.js";

class MessageController {
  private static instance: MessageController;
  private messageService: MessageService;

  constructor() {
    this.messageService = MessageService.getInstance();
  }

  public static getInstance = () => {
    if (!MessageController.instance) {
      MessageController.instance = new MessageController();
    }
    return MessageController.instance;
  };

  getMessages = async (
    req: Request,
    res: Response<ApiResponseData<Message[]>>,
  ) => {
    const { groupId, limit, offset } = req.body;

    const messages = await this.messageService.getMessages(
      groupId,
      Number(limit),
      Number(offset),
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách tin nhắn thành công!",
      data: messages,
    });
  };
}

export default MessageController;
