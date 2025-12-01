import jwt from "jsonwebtoken";
import { Socket } from "socket.io";

export default function authSocket(socket: Socket, next: any) {
  console.log("authSocket triggered");

  try {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    socket.data.user = decoded; // attach user info

    next();
  } catch (err) {
    next(new Error("Unauthorized socket connection"));
  }
}
