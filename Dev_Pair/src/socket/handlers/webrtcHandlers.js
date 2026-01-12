export const handleWebRTCEvents = (socket) => {
  // WebRTC offer
  socket.on('offer', ({ to, offer, session_id, caller_id }) => {
    socket.to(to).emit('offer', {
      from: socket.id,
      caller_id: caller_id || socket.user.id,
      offer,
      session_id
    });
  });

  // WebRTC answer
  socket.on('answer', ({ to, answer, session_id }) => {
    socket.to(to).emit('answer', {
      from: socket.id,
      answer,
      session_id
    });
  });

  // ICE candidate
  socket.on('ice-candidate', ({ to, candidate, session_id }) => {
    socket.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate,
      session_id
    });
  });

  // Connection status
  socket.on('webrtc-connection-status', ({ session_id, status, peer_id }) => {
    socket.to(session_id).emit('webrtc-connection-status', {
      user_id: socket.user.id,
      peer_id,
      status,
      session_id,
      timestamp: new Date().toISOString()
    });
  });

  // Data channel message
  socket.on('data-channel-message', ({ session_id, to, message }) => {
    socket.to(to).emit('data-channel-message', {
      from: socket.user.id,
      message,
      session_id,
      timestamp: new Date().toISOString()
    });
  });
};