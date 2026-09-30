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

  findById = async (user_id: string): Promise<User> => {
    const query =
      "SELECT id,name,email,phone,status,refresh_token,created_at,updated_at FROM Users WHERE id = $1";
    const value = [user_id];

    const result = await pool.query(query, value);

    return (result.rows[0] as User) ?? null;
  };

  findByIdWithPassword = async (
    user_id: string,
  ): Promise<UserWithPassword | null> => {
    const result = await pool.query<UserWithPassword>(
      `SELECT id,name,email,phone,password,status,refresh_token,created_at,updated_at
       FROM users WHERE id = $1`,
      [user_id],
    );
    return result.rows[0] ?? null;
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

  getAllUsers = async (search?: string) => {
    const normalizedSearch = search?.trim() ?? "";
    const result = await pool.query(
      `SELECT id,name,email,phone,status,created_at,updated_at
       FROM users
       WHERE $1 = ''
          OR name ILIKE '%' || $1 || '%'
          OR email ILIKE '%' || $1 || '%'
          OR phone ILIKE '%' || $1 || '%'
       ORDER BY name
       LIMIT 50`,
      [normalizedSearch],
    );

    return result.rows;
  };

  updatePassword = async (
    user_id: string,
    password: string,
  ): Promise<boolean> => {
    const result = await pool.query(
      `UPDATE users
       SET password = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user_id, password],
    );
    return (result.rowCount ?? 0) > 0;
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
