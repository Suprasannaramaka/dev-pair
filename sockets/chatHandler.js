import { supabase } from "../config/supabase.js";

export const chatHandler = async (io, socket) => {
  const sessionId = socket.session.id;
  socket.join(sessionId);

  socket.on("send-message", async ({ message }) => {
    try {
      if (!message || message.trim() === "") return;

      // Save message to DB
      await supabase.from("messages").insert({
        session_id: sessionId,
        sender_id: socket.user.id,
        message,
        type: "text",
      });

      // Fetch user name from "users" table
      const { data: user } = await supabase
        .from("users")
        .select("name")
        .eq("id", socket.user.id)
        .single();

      // Emit to everyone in session
      io.to(sessionId).emit("new-message", {
        sender_id: socket.user.id,
        sender_name: user?.name || "Unknown", // ✅ name included
        message,
        created_at: new Date(),
      });
    } catch (err) {
      console.error("Failed to send message:", err.message);
      socket.emit("error", { message: "Message could not be sent" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
};
