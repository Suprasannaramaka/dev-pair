    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  throw new Error("❌ Supabase environment variables are missing");
}

    // Client for public operations
    export const supabase = createClient(supabaseUrl, supabaseKey);

    // Admin client for server-side operations
    export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


   