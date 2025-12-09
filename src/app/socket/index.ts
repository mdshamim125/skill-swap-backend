// src/app/socket.ts
import { Server } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { jwtHelper } from "../helper/jwtHelper";
import { prisma } from "../shared/prisma";
import config from "../../config";
import { Secret } from "jsonwebtoken";

let io: IOServer | null = null;

/**
 * Parse cookies from socket handshake
 */
function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, value] = cookie.trim().split("=");
      return [key, decodeURIComponent(value)];
    })
  );
}

export function initSocket(server: Server) {
  io = new IOServer(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket: Socket) => {
    try {
      // 🔥 Extract JWT from cookies (HttpOnly)
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.accessToken;

      if (!token) {
        socket.emit("error_message", { message: "No auth token" });
        return socket.disconnect();
      }

      // 🔥 Verify token
      let decoded: any;
      try {
        decoded = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);
      } catch (e) {
        socket.emit("error_message", { message: "Invalid or expired token" });
        return socket.disconnect();
      }

      const userId = decoded.id;

      // Attach user to socket instance
      (socket as any).user = {
        id: decoded.id,
        role: decoded.role,
      };

      // Join personal room
      socket.join(`user:${userId}`);

      // Join all conversation rooms the user is part of
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: { id: true },
      });

      conversations.forEach((c) => {
        socket.join(`conversation:${c.id}`);
      });

      console.log(`🔥 User connected: ${userId} (${socket.id})`);

      // ---------------------
      // JOIN CONVERSATION
      // ---------------------
      socket.on("join_conversation", (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
      });

      // ---------------------
      // LEAVE CONVERSATION
      // ---------------------
      socket.on("leave_conversation", (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // ---------------------
      // SEND MESSAGE
      // ---------------------
      socket.on(
        "send_message",
        async (payload: { conversationId: string; text: string }) => {
          try {
            const senderId = (socket as any).user.id;
            const { conversationId, text } = payload;

            const conv = await prisma.conversation.findUnique({
              where: { id: conversationId },
            });

            if (!conv) {
              return socket.emit("error_message", {
                message: "Conversation not found",
              });
            }

            const receiverId =
              conv.userAId === senderId ? conv.userBId : conv.userAId;

            const message = await prisma.message.create({
              data: {
                conversationId,
                senderId,
                receiverId,
                text,
              },
              include: {
                sender: {
                  select: { id: true, name: true, avatar: true, role: true },
                },
              },
            });

            // Emit message to conversation room
            io?.to(`conversation:${conversationId}`).emit(
              "new_message",
              message
            );
          } catch (err) {
            console.error("send_message error:", err);
            socket.emit("error_message", { message: "Failed to send message" });
          }
        }
      );

      // ---------------------
      // DISCONNECT
      // ---------------------
      socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${userId} (${socket.id})`);
      });
    } catch (err) {
      console.error("Socket global error:", err);
      socket.disconnect(true);
    }
  });

  console.log("🔥 Socket.io initialized");
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
