import { createClient } from '@supabase/supabase-js';

// Paste your actual strings here temporarily
const supabaseUrl = 'https://your-project-id.supabase.co'; 
const supabaseAnonKey = 'your-long-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.log("❌ Error:", error.message);
  } else {
    console.log("✅ Success! Found profiles:", data);
  }
}

check();