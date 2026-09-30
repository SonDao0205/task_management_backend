import type { PublicUser } from "../../entity/user.types.js";

export type RegisterResponse = {
  name: String;
  email: string;
  phone: string;
};

export type LoginResponse = {
  user: PublicUser;
  access_token: string;
};
