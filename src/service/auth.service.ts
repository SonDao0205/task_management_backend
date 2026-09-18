import * as argon2 from "argon2";
import { Authenticate, BadRequest, NotFound } from "../exception/errors.js";
import UserRepository from "../repository/user.repository.js";
import type {
  LoginRequest,
  RegisterRequest,
} from "../types/dto/req/auth.request.js";
import type {
  LoginResponse,
  RegisterResponse,
} from "../types/dto/res/auth.response.js";
import type { User, UserWithPassword } from "../types/entity/user.types.js";
import TokenService from "./token.service.js";
import type { UUID } from "node:crypto";
import BlackListRepository from "../repository/blacklist.repository.js";

class AuthService {
  private static instance: AuthService;
  private readonly userRepository: UserRepository;
  private readonly tokenService: TokenService;
  private readonly blackListRepository: BlackListRepository;

  constructor() {
    this.userRepository = UserRepository.getInstance();
    this.tokenService = TokenService.getInstance();
    this.blackListRepository = BlackListRepository.getInstance();
  }

  public static getInstance = () => {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return this.instance;
  };

  hashedPassword = async (rawPassword: string) => {
    return await argon2.hash(rawPassword, {
      type: argon2.argon2id,
    });
  };

  verifyHash = async (input: string, raw: string) => {
    return await argon2.verify(raw, input);
  };

  register = async (dto: RegisterRequest): Promise<RegisterResponse> => {
    const { name, email, phone, password } = dto;

    if (!name || !email || !phone || !password) {
      throw new BadRequest(`Vui lòng nhập đầy đủ thông tin!`);
    }

    const newPassword = await this.hashedPassword(password);

    const user: User = await this.userRepository.createUser(
      name,
      email,
      phone,
      newPassword,
    );

    const response: RegisterResponse = {
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    return response;
  };

  login = async (dto: LoginRequest): Promise<LoginResponse> => {
    const { input, password } = dto;
    if (!input || !password) {
      throw new BadRequest(`Vui lòng nhập đầy đủ thông tin!`);
    }

    const findUser: UserWithPassword = input.includes("@gmail.com")
      ? await this.userRepository.findByEmail(input)
      : await this.userRepository.findByPhone(input);

    if (!findUser || !(await this.verifyHash(password, findUser.password))) {
      throw new NotFound("Sai email/phone hoặc mật khẩu!");
    }

    const access_token = await this.tokenService.createAccessToken(findUser.id);
    const refresh_token = await this.tokenService.createRefreshToken(
      findUser.id,
    );

    await this.userRepository.updateRefreshToken(
      findUser.id,
      await this.tokenService.hashRefreshToken(refresh_token),
    );

    const response: LoginResponse = {
      user: findUser,
      access_token: access_token,
      refresh_token: refresh_token,
    };
    return response;
  };

  getUser = async (user_id: string) => {
    const user = await this.userRepository.findById(user_id);
    if (!user) {
      throw new NotFound("Người dùng không tồn tại!");
    }
    return user;
  };

  refreshSession = async (user_id: string, refresh_token: string) => {
    const findUser: User = await this.userRepository.findById(user_id);

    if (!findUser || !refresh_token || !findUser.refresh_token) {
      throw new BadRequest("Dữ liệu không hợp lệ!");
    }

    if (!(await this.verifyHash(refresh_token, findUser.refresh_token))) {
      throw new Authenticate("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
    }
    const new_access_token = await this.tokenService.createAccessToken(
      findUser.id,
    );
    const new_refresh_token = await this.tokenService.createRefreshToken(
      findUser.id,
    );

    await this.userRepository.updateRefreshToken(
      findUser.id,
      await this.tokenService.hashRefreshToken(new_refresh_token),
    );
    await this.blackListRepository.setKey(refresh_token);

    return { access_token: new_access_token, refresh_token: new_access_token };
  };

  logOut = async (user_id: string, access_token: string) => {
    const user: User = await this.userRepository.findById(user_id);
    if (!user) {
      throw new BadRequest("Người dùng không tồn tại!");
    }

    await this.blackListRepository.setKey(access_token);
    await this.userRepository.updateRefreshToken(user.id, null);

    return null;
  };
}

export default AuthService;
