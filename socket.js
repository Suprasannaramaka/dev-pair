export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-session", ({ session_id }) => {
      socket.join(session_id);
      console.log(`Socket ${socket.id} joined session ${session_id}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
