import { supabase } from "../config/supabase.js";

// 🔐 Socket-level authentication middleware
export const socketSessionAuth = async (socket, next) => {
  try {
    const { session_id, user_id } = socket.handshake.auth;

    if (!session_id || !user_id) {
      return next(new Error("Missing auth data"));
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (error || !session) {
      return next(new Error("Session not found"));
    }

    if (session.mentor_id !== user_id && session.student_id !== user_id) {
      return next(new Error("Access denied"));
    }

    // Attach session & user to socket
    socket.session = session;
    socket.user = { id: user_id };

    next();
  } catch (err) {
    next(new Error("Socket auth failed"));
  }
};
