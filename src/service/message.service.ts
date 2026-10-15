import { BadRequest } from "../exception/errors.js";
import MessageRepository from "../repository/message.repository.js";
import type { MessageRequest } from "../types/dto/req/message.request.js";
import type { Message } from "../types/entity/group_chat.types.js";
import GroupService from "./group.service.js";

class MessageService {
  private static instance: MessageService;
  private messageRepository: MessageRepository;
  private groupService: GroupService;

  constructor() {
    this.messageRepository = MessageRepository.getInstance();
    this.groupService = GroupService.getInstance();
  }

  public static getInstance = () => {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  };

  getMessages = async (
    groupId: string,
    limit: number,
    offset: number,
  ): Promise<Message[]> => {
    const messages = await this.messageRepository.getMessages(
      groupId,
      limit,
      offset,
    );

    return messages;
  };

  createMessage = async (req: MessageRequest) => {
    const { content, created_by_id, group_chat_id } = req;
    const exist = await this.groupService.isExistInGroup(
      created_by_id,
      group_chat_id,
    );
    if (!exist) {
      throw new BadRequest("Người dùng này không tồn tại trong Group Chat!");
    }

    if (content.trim().length == 0) {
      throw new BadRequest("Tin nhắn không được bỏ trống!");
    }

    const messaged = await this.messageRepository.createMessage(
      content,
      created_by_id,
      group_chat_id,
    );

    return messaged;
  };
}

export default MessageService;
