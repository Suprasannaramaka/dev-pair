import { supabase } from "../config/supabase.js";





export const verifyAuth = async (req, res, next) => {
  try {
    const {token} = req.cookies;
    if (!token)
      return res.status(401).json({ success: false, message: "No token found" });

    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user)
      return res.status(401).json({ success: false, message: "Invalid token" });
 
    
    req.user = data.user;
    

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};
