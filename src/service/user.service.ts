import { BadRequest, NotFound } from "../exception/errors.js";
import UserRepository from "../repository/user.repository.js";

class UserService {
  private static instance: UserService;
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = UserRepository.getInstance();
  }

  public static getInstance = () => {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return this.instance;
  };

  getAllUsers = async () => {
    return await this.userRepository.getAllUsers();
  };

  getUserById = async (user_id: string) => {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new BadRequest("Người dùng không tồn tại!");
    }
  };
}

export default UserService;
