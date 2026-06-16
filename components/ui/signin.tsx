'use client';
import { supabase } from '@/app/src/lib/supabase/supabase';
import { FolderGit } from 'lucide-react';

export default function AuthButton() {
  
  // 1. THE ACTION: Pure logic for signing in
  const signIn = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // 2. THE HANDLER: Manages the UI state (errors, loading, etc.)
  const handleSignIn = async () => {
    const { error } = await signIn();

    if (error) {
      console.error('Sign-in failed:', error.message);
      // You could set an error state here to show a toast/alert
    }
  };

  return (
    <button 
      onClick={handleSignIn}
      className="flex items-center gap-2 border border-gray-700 px-5 py-2 rounded-full text-sm hover:bg-gray-800 transition"
    >
      <FolderGit size={18} /> 
      Sign In with GitHub
    </button>
  );
}