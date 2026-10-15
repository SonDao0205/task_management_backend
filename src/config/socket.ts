import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { mainSocket } from "../socket/main.socket.js";
import { setSocketServer } from "../socket/runtime.js";
import TokenService from "../service/token.service.js";

export let io: Server;

export const connectSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
    },
  });
  setSocketServer(io);

  const tokenService = TokenService.getInstance();
  io.use(async (socket, next) => {
    const accessToken = socket.handshake.auth?.accessToken;
    if (typeof accessToken !== "string" || !accessToken) {
      next(new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!"));
      return;
    }

    try {
      const { payload } = await tokenService.verifyAccessToken(accessToken);
      socket.data.userId = payload.user_id;
      next();
    } catch {
      next(new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!"));
    }
  });

  mainSocket(io);
};
