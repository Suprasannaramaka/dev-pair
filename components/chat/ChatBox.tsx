'use client';
import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { Send } from 'lucide-react';

interface ChatMessage {
  text: string;
  sender: string;
  time: string;
}
export default function Chat({ ydoc, username }: { ydoc: Y.Doc, username: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const yArray = ydoc.getArray('chat-messages');

  useEffect(() => {
    // Sync initial state and listen for new messages
    const updateMessages = () => {
    // Cast the Yjs array to our interface
    const data = yArray.toArray() as ChatMessage[];
    setMessages(data);
  };
    yArray.observe(updateMessages);
    updateMessages();

    return () => yArray.unobserve(updateMessages);
  }, [ydoc, yArray]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msg = {
       text: input,
      sender: username,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    yArray.push([msg]); // This syncs to all peers instantly
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 w-80">
      <div className="p-4 border-b border-gray-800 font-bold text-sm">Session Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === username ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-500 mb-1">{m.sender} • {m.time}</span>
            <div className={`px-3 py-2 rounded-lg text-sm ${m.sender === username ? 'bg-blue-600' : 'bg-gray-800'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="p-2 bg-blue-600 rounded hover:bg-blue-700">
          <Send size={16} />Submit
        </button>
      </form>
    </div>
  );
}