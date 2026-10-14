import GroupRepository from "../repository/group.repository.js";

class GroupService {
  private static instance: GroupService;
  private groupRepository: GroupRepository;

  constructor() {
    this.groupRepository = GroupRepository.getInstance();
  }

  public static getInstance = () => {
    if (!GroupService.instance) {
      GroupService.instance = new GroupService();
    }
    return this.instance;
  };

  getGroupsByUser = async (userId: string, limit: number, offset: number) => {
    const groups = await this.groupRepository.getUserGroups(
      userId,
      limit,
      offset,
    );

    return groups;
  };
}

export default GroupService;
