'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/src/lib/supabase/supabase';
import dynamic from 'next/dynamic';

// Import our Yjs Editor without SSR
const CollaborativeEditor = dynamic(() => import('@/components/editor/Editor'), { ssr: false });
interface Session {
  id: string;
  title: string;
  mentor_id: string;
  is_active: boolean;
}
export default function SessionRoom({ params }: { params: { id: string } })
 {
  const [sessionData, setSessionData] = useState<Session | null > (null);
  useEffect(() => {
    // Verify the session exists in Supabase
    const getSession = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) setSessionData(data);
    };
    getSession();
  }, [params.id]);
  if (!sessionData) 
    return 
  <div className="h-screen bg-black flex items-center justify-center text-white">Finding Session...
  </div>;
  return (
    <div className="h-screen bg-black flex flex-col">
      <nav className="p-4 border-b border-gray-800 flex justify-between items-center text-white">
        <h2 className="font-mono text-blue-500 font-bold">{sessionData.title}</h2>
        <div className="flex gap-4 text-xs">
          <span className="text-gray-500">Session ID: {params.id}</span>
        </div>
      </nav>
      <div className="flex-1">
        <CollaborativeEditor roomId={params.id} username="User" />
      </div>
    </div>
  );
}