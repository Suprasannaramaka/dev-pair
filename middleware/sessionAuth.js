import { supabase } from "../config/supabase.js";

export const sessionAuth = async (req, res, next) => {
  try {
    const user = req.user;
    const { sessionId } = req.params;

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (
      session.mentor_id !== user.id &&
      session.student_id !== user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.session = session;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
