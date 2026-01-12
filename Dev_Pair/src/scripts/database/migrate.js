import { supabase } from '../../config/supabase.js';

const migrations = [
    // Migration 1: Create users table
    `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
    image TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    experience TEXT,
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

    // Migration 2: Create sessions table
    `
  CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    mentor_id UUID REFERENCES users(id) NOT NULL,
    student_id UUID REFERENCES users(id),
    status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'ended', 'cancelled')) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    recording_url TEXT,
    recording_started_at TIMESTAMP WITH TIME ZONE,
    recording_ended_at TIMESTAMP WITH TIME ZONE,
    recording_duration INTEGER,
    is_recording BOOLEAN DEFAULT FALSE
  );
  `,

    // Migration 3: Create session chats table
    `
  CREATE TABLE IF NOT EXISTS session_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_name TEXT,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system'))
  );
  `,

    // Migration 4: Create indexes
    `
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON sessions(mentor_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_session_chats_session_id ON session_chats(session_id);
  CREATE INDEX IF NOT EXISTS idx_session_chats_timestamp ON session_chats(timestamp);
  `,

    // Migration 5: Enable RLS and create policies
    `
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE session_chats ENABLE ROW LEVEL SECURITY;

  -- Users policies
  CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

  -- Sessions policies
  CREATE POLICY "Session participants can view session" ON sessions
    FOR SELECT USING (auth.uid() IN (mentor_id, student_id));

  CREATE POLICY "Mentors can create sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = mentor_id);

  CREATE POLICY "Mentors can update their sessions" ON sessions
    FOR UPDATE USING (auth.uid() = mentor_id);

  -- Chat policies
  CREATE POLICY "Session participants can view chat" ON session_chats
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM sessions s 
        WHERE s.id = session_chats.session_id 
        AND (s.mentor_id = auth.uid() OR s.student_id = auth.uid())
      )
    );

  CREATE POLICY "Session participants can send chat" ON session_chats
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM sessions s 
        WHERE s.id = session_chats.session_id 
        AND (s.mentor_id = auth.uid() OR s.student_id = auth.uid())
      )
    );
  `,

    // Migration 6: Create storage buckets
    `
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('profile_image', 'profile_image', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('session_files', 'session_files', true)
  ON CONFLICT (id) DO NOTHING;
  `
];

async function runMigrations() {
    console.log('🚀 Starting database migrations...');

    for (let i = 0; i < migrations.length; i++) {
        try {
            console.log(`🔄 Running migration ${i + 1}/${migrations.length}...`);
            const { error } = await supabase.rpc('exec_sql', { sql: migrations[i] });

            if (error) {
                // If exec_sql function doesn't exist, run raw SQL (admin client needed)
                console.log('Using raw SQL execution...');
                const { error: sqlError } = await supabase.rpc('exec_sql', migrations[i]);
                if (sqlError) throw sqlError;
            }

            console.log(`✅ Migration ${i + 1} completed`);
        } catch (error) {
            console.error(`❌ Migration ${i + 1} failed:`, error.message);
            process.exit(1);
        }
    }

    console.log('🎉 All migrations completed successfully!');
}

runMigrations().catch(console.error);