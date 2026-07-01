import { socketSessionAuth } from "./middleware.js";
import { chatHandler } from "./chatHandler.js";

export const initSocket = (io) => {
  // Socket middleware for auth
  io.use(socketSessionAuth);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Handle chat events
    chatHandler(io, socket);
  });
};
