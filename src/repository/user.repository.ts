import { randomUUID, type UUID } from "node:crypto";
import { pool } from "../config/database.js";
import { BadRequest } from "../exception/errors.js";
import {
  UserStatus,
  type User,
  type UserWithPassword,
} from "../types/entity/user.types.js";

class UserRepository {
  private static instance: UserRepository;

  public static getInstance = (): UserRepository => {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return this.instance;
  };

  findByEmail = async (email: string) => {
    const query =
      "SELECT id,name,email,phone, password,status,created_at,updated_at FROM Users WHERE email = $1";

    const value = [email];

    const result = await pool.query(query, value);

    return (result.rows[0] as UserWithPassword) ?? null;
  };

  findByPhone = async (phone: string) => {
    const query =
      "SELECT id,name,email,phone, password,status,created_at,updated_at FROM Users WHERE phone = $1";

    const value = [phone];

    const result = await pool.query(query, value);

    return (result.rows[0] as UserWithPassword) ?? null;
  };

  findById = async (user_id: string) => {
    const query =
      "SELECT id,name,email,phone, password,status,refresh_token,created_at,updated_at FROM Users WHERE id = $1";
    const value = [user_id];

    const result = await pool.query(query, value);

    return (result.rows[0] as User) ?? null;
  };

  createUser = async (
    name: string,
    email: String,
    phone: string,
    password: string,
  ) => {
    const query = `
    INSERT INTO users(id,name,email,phone,password,status) VALUES
    ($1,$2,$3,$4,$5,$6)
    RETURNING id,name,email,phone,status,created_at,updated_at
    `;

    const value = [
      randomUUID(),
      name,
      email,
      phone,
      password,
      UserStatus.ACTIVE,
    ];

    try {
      const result = await pool.query(query, value);

      return (result.rows[0] as User) ?? null;
    } catch (error) {
      if (error instanceof Error && "constraint" in error) {
        const details = "details" in error ? error.details : undefined;

        if (error.constraint === "email_unq") {
          throw new BadRequest("Email đã tồn tại!", details);
        }

        if (error.constraint === "phone_unq") {
          throw new BadRequest("Số điện thoại đã tồn tại!", details);
        }
      }

      throw error;
    }
  };

  getAllUsers = async () => {
    const query = `
    SELECT id,name,email,phone,status,created_at,updated_at FROM Users
    `;

    const result = await pool.query(query);

    return result.rows;
  };

  updateRefreshToken = async (
    user_id: string,
    refresh_token: string | null,
  ) => {
    const query = `
    UPDATE users
    SET refresh_token = $2
    WHERE id = $1
    `;

    const value = [user_id, refresh_token];

    const result = await pool.query(query, value);

    return result.rows[0] ?? null;
  };
}

export default UserRepository;
