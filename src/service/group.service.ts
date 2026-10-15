import GroupRepository from "../repository/group.repository.js";
import MessageRepository from "../repository/message.repository.js";
import type { GroupChatResponse } from "../types/dto/res/group_chat.response.js";
import type { GroupChat } from "../types/entity/group_chat.types.js";

class GroupService {
  private static instance: GroupService;
  private groupRepository: GroupRepository;
  private messageRepository: MessageRepository;

  constructor() {
    this.groupRepository = GroupRepository.getInstance();
    this.messageRepository = MessageRepository.getInstance();
  }

  public static getInstance = () => {
    if (!GroupService.instance) {
      GroupService.instance = new GroupService();
    }
    return this.instance;
  };

  getGroupsByUser = async (
    userId: string,
    limit: number,
    offset: number,
  ): Promise<GroupChatResponse[]> => {
    const groups = await this.groupRepository.getUserGroups(
      userId,
      limit,
      offset,
    );

    const response: GroupChatResponse[] = await Promise.all(
      groups.map(async (element: GroupChat) => {
        const latestMessage = await this.messageRepository.getLatestMessage(
          element.id,
        );
        return {
          group_chat: element,
          latest_message: latestMessage,
        };
      }),
    );

    return response;
  };

  getGroupIdsByUser = async (userId: string): Promise<string[]> => {
    return this.groupRepository.getUserGroupIds(userId);
  };

  isExistInGroup = async (userId: string, group_chat_id: string) => {
    const exist = await this.groupRepository.inGroupChat(userId, group_chat_id);

    return exist;
  };
}

export default GroupService;
