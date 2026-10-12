import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { mainSocket } from "../socket/main.socket.js";

export let io: Server;

export const connectSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
    },
  });

  mainSocket(io);
};
