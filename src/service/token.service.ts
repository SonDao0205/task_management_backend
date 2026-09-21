import * as argon2 from "argon2";
import type { UUID } from "node:crypto";
import type { UserTokenPayload } from "../types/entity/user.types.js";
import { jwtVerify, SignJWT } from "jose";
import { Authenticate } from "../exception/errors.js";
import BlackListRepository from "../repository/blacklist.repository.js";

class TokenService {
  private static instance: TokenService;
  private accessTokenSecret: Uint8Array;
  private refreshTokenSecret: Uint8Array;
  private accessTokenExpires: string;
  private refreshTokenExpires: string;

  private readonly blackListRepository: BlackListRepository;
  constructor() {
    this.blackListRepository = BlackListRepository.getInstance();

    this.accessTokenSecret = new TextEncoder().encode(
      String(process.env.JWT_ACCESS_SECRET),
    );
    this.refreshTokenSecret = new TextEncoder().encode(
      String(process.env.JWT_REFRESH_SECRET),
    );
    this.accessTokenExpires = String(process.env.JWT_ACCESS_EXPIRES_IN);
    this.refreshTokenExpires = String(process.env.JWT_REFRESH_EXPIRES_IN);
  }

  public static getInstance = () => {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return this.instance;
  };

  createToken = async (
    value: UserTokenPayload,
    secretKey: Uint8Array,
    expiresTime: string,
  ) => {
    return await new SignJWT(value)
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setIssuedAt()
      .setExpirationTime(expiresTime)
      .sign(secretKey);
  };

  verifyToken = async (token: string, secretKey: Uint8Array) => {
    try {
      const { payload } = await jwtVerify<UserTokenPayload>(token, secretKey, {
        algorithms: ["HS256"],
      });
      return { payload };
    } catch (error) {
      console.log("error : ", error);

      throw new Authenticate("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
    }
  };

  createAccessToken = async (user_id: string) => {
    return await this.createToken(
      { user_id },
      this.accessTokenSecret,
      this.accessTokenExpires,
    );
  };

  createRefreshToken = async (user_id: string) => {
    return await this.createToken(
      { user_id },
      this.refreshTokenSecret,
      this.refreshTokenExpires,
    );
  };

  hashRefreshToken = async (refreshToken: string): Promise<string> => {
    return await argon2.hash(refreshToken, {
      type: argon2.argon2id,
    });
  };

  verifyAccessToken = async (accessToken: string) => {
    const black_list = await this.blackListRepository.getKey("blacklist");
    const isExist = black_list.findIndex((element) => element === accessToken);

    if (isExist !== -1) {
      throw new Authenticate("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
    }
    return await this.verifyToken(accessToken, this.accessTokenSecret);
  };

  verifyRefreshToken = async (refreshToken: string) => {
    const black_list = await this.blackListRepository.getKey("blacklist");
    const isExist = black_list.findIndex((element) => element === refreshToken);
    if (isExist !== -1) {
      throw new Authenticate("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
    }
    return await this.verifyToken(refreshToken, this.refreshTokenSecret);
  };
}

export default TokenService;
