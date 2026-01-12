import { supabase } from "../config/supabase.js";

/* --------------------------------------------------
    Create Session (Mentor only)
-------------------------------------------------- */
export const createSession = async (req, res) => {
  try {
    const user = req.user;
    const user_metadata = user.user_metadata
    const { title } = req.body;

    if (user_metadata.role !== "mentor") {
      return res.status(403).json({ message: "Only mentor can create session" });
    }

    if (!title) {
      return res.status(400).json({ message: "Session title required" });
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        title,
        mentor_id: user.id,
        status: "waiting",
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      session: data,
      join_link: `${process.env.FRONTEND_URL}/api/sessions/join/${data.id}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------------------------
    Join Session (Student only)
-------------------------------------------------- */
export const joinSession = async (req, res) => {
  try {
    const user = req.user;
    const user_metadata = user.user_metadata
    const { sessionId } = req.params;

    if (user_metadata.role !== "student") {
      return res.status(403).json({ message: "Only student can join" });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.student_id) {
      return res.status(400).json({ message: "Session already full" });
    }

    await supabase
      .from("sessions")
      .update({
        student_id: user.id,
        status: "active",
      })
      .eq("id", sessionId);

    res.json({ success: true, message: "Joined session" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------------------------
    Get Session Details
-------------------------------------------------- */
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id,
        title,
        status,
        created_at,
        mentor:mentor_id(id, name),
        student:student_id(id, name)
      `)
      .eq("id", sessionId)
      .single();

    if (error) throw error;

    res.json({ success: true, session: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------------------------
    Session History
-------------------------------------------------- */
export const getSessionHistory = async (req, res) => {
  try {
    const user = req.user;
    const user_metadata = user.user_metadata

    let query = supabase.from("sessions").select("*");

    if (user_metadata.role === "mentor") {
      query = query.eq("mentor_id", user.id);
    } else {
      query = query.eq("student_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    res.json({ success: true, sessions: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------------------------
    End Session (Mentor only)
-------------------------------------------------- */
export const endSession = async (req, res) => {
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

    if (session.mentor_id !== user.id) {
      return res.status(403).json({ message: "Only mentor can end session" });
    }

    await supabase
      .from("sessions")
      .update({
        status: "ended",
        ended_at: new Date(),
      })
      .eq("id", sessionId);

    res.json({ success: true, message: "Session ended" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
