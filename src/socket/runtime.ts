import type { Server } from "socket.io";

let socketServer: Server | null = null;

export const setSocketServer = (server: Server) => {
  socketServer = server;
};

export const getSocketServer = () => socketServer;
