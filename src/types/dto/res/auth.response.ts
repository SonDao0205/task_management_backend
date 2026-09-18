import type { User } from "../../entity/user.types.js";

export type RegisterResponse = {
  name: String;
  email: string;
  phone: string;
};

export type LoginResponse = {
  user: User;
  access_token: string;
  refresh_token: string;
};
