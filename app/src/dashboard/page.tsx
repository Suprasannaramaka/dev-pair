'use client';
import { useState } from 'react';
import {supabase} from '@/app/src/lib/supabase/supabase';
import { useRouter } from 'next/navigation';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function MentorDashboard() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateSession = async () => {
    setLoading(true);
    
    // 1. Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login first");

    // 2. Insert the session into the DB
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        { 
          mentor_id: user.id, 
          title: `Mentorship Session with ${user.email?.split('@')[0]}` 
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error: " + error.message);
    } else {
      // 3. Success! Redirect to the collaboration room
      router.push(`/session/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-2">Mentor Dashboard</h1>
        <p className="text-gray-400 mb-8 text-sm">Create a secure link to start a pair-programming session.</p>
        
        <button 
          onClick={handleCreateSession}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
          {loading ? 'Initializing Room...' : 'Start New Session'}
        </button>
      </div>
    </div>
  );
}