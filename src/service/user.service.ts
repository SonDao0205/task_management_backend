import * as argon2 from "argon2";
import { BadRequest, NotFound } from "../exception/errors.js";
import UserRepository from "../repository/user.repository.js";
import type { ChangePasswordRequest } from "../types/dto/req/user.request.js";

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

  getAllUsers = async (search?: string) => {
    return this.userRepository.getAllUsers(search);
  };

  getUserById = async (user_id: string) => {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new BadRequest("Người dùng không tồn tại!");
    }
    return user;
  };

  changePassword = async (
    user_id: string,
    dto: ChangePasswordRequest,
  ): Promise<void> => {
    if (!dto || typeof dto !== "object" || Array.isArray(dto)) {
      throw new BadRequest("Dữ liệu đổi mật khẩu không hợp lệ!");
    }
    const { current_password, new_password } = dto;
    if (!current_password || !new_password) {
      throw new BadRequest("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!");
    }
    if (new_password.length < 8 || new_password.length > 50) {
      throw new BadRequest("Mật khẩu mới phải có từ 8 đến 50 ký tự!");
    }
    if (current_password === new_password) {
      throw new BadRequest("Mật khẩu mới phải khác mật khẩu hiện tại!");
    }

    const user = await this.userRepository.findByIdWithPassword(user_id);
    if (!user) throw new NotFound("Người dùng không tồn tại!");
    if (!(await argon2.verify(user.password, current_password))) {
      throw new BadRequest("Mật khẩu hiện tại không chính xác!");
    }

    const password = await argon2.hash(new_password, { type: argon2.argon2id });
    const updated = await this.userRepository.updatePassword(user_id, password);
    if (!updated) throw new NotFound("Người dùng không tồn tại!");
  };
}

export default UserService;
