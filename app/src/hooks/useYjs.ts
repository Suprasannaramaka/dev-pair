'use client';
import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export const useYjs = (roomId: string) => {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [provider, setProvider] = useState<WebrtcProvider |  null>(null);

  useEffect(() => {
    // In a real app, use a secured signaling server. 
    // 'wss://signaling.yjs.dev' is for testing only.
    const newProvider = new WebrtcProvider(roomId, ydoc, {
      signaling: ['wss://signaling.yjs.dev'],
    });
    setProvider(newProvider);
    return () => {
      newProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId, ydoc]);
  return { ydoc, provider };
};