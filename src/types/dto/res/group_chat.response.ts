import type { GroupChat, Message } from "../../entity/group_chat.types.js";
import type { WorkSpace } from "../../entity/workspace.types.js";

export type GroupChatResponse = {
  group_chat: GroupChat;
  latest_message: Message;
};
