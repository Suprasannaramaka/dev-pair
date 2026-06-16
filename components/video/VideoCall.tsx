'use client';

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { HocuspocusProvider } from '@hocuspocus/provider';

interface VideoCallProps {
  provider: HocuspocusProvider;
  roomId: string;
}

interface VideoSignalData {
  videoSignal?: Peer.SignalData;
}

export default function VideoCall({
  provider,
}: VideoCallProps) {
  const [error, setError] = useState<string | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);

  const peerRef = useRef<Peer.Instance | null>(null);

  const processedSignals = useRef(
    new Set<string>()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    const initializeCall = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        if (!mounted) return;

        localStreamRef.current = stream;

        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }

        const isInitiator =
          window.location.hash === '#init';

        const peer = new Peer({
          initiator: isInitiator,
          trickle: false,
          stream,
          config: {
            iceServers: [
              {
                urls:
                  'stun:stun.l.google.com:19302',
              },
              {
                urls:
                  'stun:stun1.l.google.com:19302',
              },
            ],
          },
        });

        peerRef.current = peer;

        peer.on('signal', (data) => {
          provider.awareness.setLocalStateField(
            'videoSignal',
            data
          );
        });

        const handleAwarenessChange = () => {
          const states =
            provider.awareness.getStates();

          states.forEach(
            (
              state: VideoSignalData,
              clientId: number
            ) => {
              if (
                clientId ===
                provider.awareness.clientID
              ) {
                return;
              }

              if (!state.videoSignal) {
                return;
              }

              const signalKey = JSON.stringify(
                state.videoSignal
              );

              if (
                processedSignals.current.has(
                  signalKey
                )
              ) {
                return;
              }

              processedSignals.current.add(
                signalKey
              );

              try {
                peer.signal(state.videoSignal);
              } catch (err) {
                console.error(
                  'Signal processing error:',
                  err
                );
              }
            }
          );
        };

        provider.awareness.on(
          'change',
          handleAwarenessChange
        );

        peer.on('connect', () => {
          setPeerConnected(true);
        });

        peer.on('stream', (remoteStream) => {
          setPeerConnected(true);

          if (userVideo.current) {
            userVideo.current.srcObject =
              remoteStream;
          }
        });

        peer.on('error', (err) => {
          console.error(
            'WebRTC Peer Error:',
            err
          );

          setError(
            'Failed to establish connection.'
          );
        });

        peer.on('close', () => {
          setPeerConnected(false);
        });

        return () => {
          provider.awareness.off(
            'change',
            handleAwarenessChange
          );
        };
      } catch (err) {
        console.error(
          'Media Access Error:',
          err
        );

        setError(
          'Could not access camera or microphone.'
        );
      }
    };

    let cleanup:
      | (() => void)
      | undefined;

    initializeCall().then((fn) => {
      cleanup = fn;
    });

    return () => {
      mounted = false;

      cleanup?.();

      localStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      peerRef.current?.destroy();
    };
  }, [provider]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 text-red-200 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-950 p-4 rounded-2xl border border-gray-800">
        <div className="relative">
          <video
            ref={myVideo}
            playsInline
            muted
            autoPlay
            className="rounded-xl w-full aspect-video object-cover bg-gray-900 border border-gray-700"
          />

          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded text-[10px] text-white">
            You
          </div>
        </div>

        <div className="relative">
          <video
            ref={userVideo}
            playsInline
            autoPlay
            className="rounded-xl w-full aspect-video object-cover bg-gray-900 border border-gray-700"
          />

          <div className="absolute bottom-3 left-3 px-2 py-1 bg-indigo-600/80 rounded text-[10px] text-white">
            Remote Peer
          </div>

          {!peerConnected && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Waiting for peer to join...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}