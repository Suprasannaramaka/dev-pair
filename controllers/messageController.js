import { supabase } from "../config/supabase.js";

// 🟢 Get chat history
export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json({ success: true, messages: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
