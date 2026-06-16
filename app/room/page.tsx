'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { 
  Code2, Users, Zap, Shield, 
  ChevronRight,  X 
} from 'lucide-react';

// Custom internal imports
import { supabase } from '../src/lib/supabase/supabase';
import { Login } from '@/components/login';
import SignIn from '@/components/ui/signin';

export default function LandingPage() {
  // --- 1. STATE MANAGEMENT ---
  const [activeModal, setActiveModal] = useState<'Login' | 'signin' | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 2. AUTHENTICATION LOGIC ---
  useEffect(() => {
    // Check if user is already logged in when page opens
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout events automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error('Login error:', error.message);
  };

  // --- 3. LOADING SCREEN ---
  if (loading) {
    return (
      <div className="h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl animate-bounce">
          <Code2 size={32} className="text-white" />
        </div>
        <span className="text-blue-500 font-mono tracking-widest animate-pulse">
          INITIALIZING...
        </span>
      </div>
    );
  }

  // --- 4. MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white font-sans selection:bg-blue-500/30">
      
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-gray-800/50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg">
            <Code2 size={24} />
          </div>
          DEV-PAIR
        </div>

        <div className="flex gap-4 items-center">
          {session ? (
            <Link href="/dashboard" className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-200">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <button 
                onClick={() => setActiveModal('signin')}
                className="px-5 py-2 border border-gray-700 rounded-full text-sm hover:bg-gray-800 transition"
              >
                Sign In
              </button>
              <button 
                onClick={() => setActiveModal('Login')}
                className="px-5 py-2 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-700 transition"
              >
                Login
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-24 pb-32 text-center relative">
        <h1 className="text-6xl md:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight">
          Real-time coding for <br />
          <span className="text-blue-500">Mentors</span> and <span className="text-purple-500">Students</span>.
        </h1>
        <p className="text-gray-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
          A high-performance collaborative IDE with P2P video calls and zero-latency code syncing.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-24">
          <button 
            onClick={session ? undefined : handleGitHubLogin} 
            className="bg-blue-600 hover:bg-blue-700 px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-2 transition hover:scale-105"
          >
            {session ? "Enter Workspace" : "Get Started for Free"} <ChevronRight size={22} />
          </button>
          <button className="bg-gray-800/30 hover:bg-gray-800 px-10 py-5 rounded-2xl font-bold text-lg border border-gray-700">
            View Documentation
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <FeatureCard 
            icon={<Zap className="text-yellow-400" />}
            title="P2P CRDT Sync"
            desc="Experience sub-millisecond sync without a centralized server bottleneck."
          />
          <FeatureCard 
            icon={<Shield className="text-green-400" />}
            title="Secure Sessions"
            desc="Supabase Auth ensures only authorized users can join your room."
          />
          <FeatureCard 
            icon={<Users className="text-purple-400" />}
            title="Integrated Video"
            desc="Built-in WebRTC video calls make mentorship feel like you're in the same room."
          />
        </div>
      </main>

      {/* --- 5. MODAL SYSTEM (Popups) --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur Background: Clicking this closes the modal */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => setActiveModal(null)} 
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md bg-[#161b22] border border-gray-800 p-8 rounded-3xl shadow-2xl">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            > Sign-In
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">
              {activeModal === 'signin' ? 'Sign In' : 'Welcome Back'}
            </h2>

            {activeModal === 'signin' && <SignIn />}
            {activeModal === 'Login' && <Login />}
          </div>
        </div>
      )}

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

// --- 6. SUB-COMPONENTS (Cleanliness) ---
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-gray-900/40 border border-gray-800 rounded-3xl hover:border-gray-600 transition group backdrop-blur-sm">
      <div className="mb-6 p-4 bg-gray-800/50 w-fit rounded-2xl group-hover:bg-gray-800 transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}