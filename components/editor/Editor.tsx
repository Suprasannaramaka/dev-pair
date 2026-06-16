'use client';
import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import type * as monaco from 'monaco-editor';

interface EditorProps {
  roomId: string;
  username: string;
}
interface UserPresence {
  user: {
    name: string;
    color: string;
  };
  // Yjs awareness states can also include other fields like 'cursor'
  [key: string]: string | number | boolean | undefined | object;
}

export default function CollaborativeEditor({ roomId, username }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
// Replace <any[]> with <UserPresence[]>
const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);

  // We use a ref for the provider so it persists across re-renders
  const providerRef = useRef<WebrtcProvider | null>(null);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // 1. Initialize Yjs Document
    const doc = new Y.Doc();

    // 2. Setup WebRTC Provider
    // In production, you would use a signaling server URL as the second argument
    const provider = new WebrtcProvider(roomId, doc);
    providerRef.current = provider;

    const type = doc.getText('monaco');

    // 3. Setup Awareness (Presence)
    const awareness = provider.awareness;
    
    // Assign a random professional Tailwind color class to the user
    const userColorClasses = [
      'bg-emerald-500',
      'bg-sky-500',
      'bg-violet-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-fuchsia-500',
      'bg-rose-500',
    ];

    const userColor = userColorClasses[Math.floor(Math.random() * userColorClasses.length)];

    awareness.setLocalStateField('user', {
      name: username,
      color: userColor,
    });

    awareness.on('change', () => {
      // Get all states and cast them to our interface
      const states = Array.from(awareness.getStates().values()) as UserPresence[];
      
      // Filter out any empty states to ensure we only have valid users
      setActiveUsers(states.filter((s) => s.user));
    });

    // 4. Bind Yjs to Monaco
    const binding = new MonacoBinding(
      type,
      editor.getModel()!,
      new Set([editor]),
      awareness
    );

    console.log(`Connected to room: ${roomId} as ${username}`);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full border border-gray-800 rounded-lg overflow-hidden">
      {/* Presence Bar */}
      <div className="bg-[#1e1e1e] border-b border-gray-800 p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-400 font-mono">Live Collaboration</span>
        </div>
        
        <div className="flex -space-x-2 mr-2">
          {activeUsers.map((u, i) => (
            <div key={i} 
            className="w-7 h-7 rounded-full border-2 border-[#1e1e1e] flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
              style={{ backgroundColor: u.user.color }}
              title={u.user.name}>{u.user.name[0].toUpperCase()}</div>
          ))}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          defaultLanguage="javascript"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 16 },
            fontFamily: "'Fira Code', monospace",
          }}
        />
      </div>
    </div>
  );
}