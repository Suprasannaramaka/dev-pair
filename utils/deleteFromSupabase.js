import { supabase } from "../config/supabase.js";




export const deleteFromSupabase = async (bucket, fileName) => {
  const { error } = await supabase
    .storage
    .from(bucket)
    .remove([fileName]);

  if (error) throw error;

  return true; // deletion successful
};
