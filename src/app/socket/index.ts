import { Server } from "socket.io";
import http from "http";
import authSocket from "./authSocket";
import chatHandlers from "./chatHandlers";


let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // your frontend domain
    },
  });

  // Authenticate socket
  io.use(authSocket);

  // Register events
  io.on("connection", (socket) => {
    console.log("User connected:", socket.data.user.id);

    chatHandlers(io, socket);
  });

  return io;
};

export const getIO = () => io;
