// import { Server, Socket } from "socket.io";
// import { chatService } from "../modules/chatting/chatting.service";

// export default function chatHandlers(io: Server, socket: Socket) {
//   const user = socket.data.user;

//   // JOIN PRIVATE ROOM
//   socket.on("join_conversation", async ({ receiverId }) => {
//     const roomId = chatService.getRoomId(user.id, receiverId);
//     socket.join(roomId);
//   });

//   // SEND MESSAGE
//   socket.on("send_message", async ({ receiverId, text }) => {
//     const roomId = chatService.getRoomId(user.id, receiverId);

//     // Store message in DB
//     const message = await chatService.saveMessage({
//       senderId: user.id,
//       receiverId,
//       text,
//     });

//     // Emit to room
//     io.to(roomId).emit("new_message", message);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", user.id);
//   });
// }
