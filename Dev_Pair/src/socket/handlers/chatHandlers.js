export const handleChatEvents = (socket) => {
    // Send chat message
    socket.on('chat-message', ({ session_id, message, sender_name }) => {
        const chatData = {
            message,
            sender_id: socket.user.id,
            sender_name: sender_name || socket.user.user_metadata?.name || socket.user.profile?.name,
            session_id,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        // Broadcast to everyone in the session including sender
        socket.to(session_id).emit('chat-message', chatData);

        // Also emit to sender for UI update
        socket.emit('chat-message-sent', chatData);
    });

    // Typing indicator
    socket.on('typing', ({ session_id, isTyping }) => {
        socket.to(session_id).emit('typing', {
            user_id: socket.user.id,
            isTyping,
            session_id
        });
    });

    // Read receipt
    socket.on('message-read', ({ session_id, message_id }) => {
        socket.to(session_id).emit('message-read', {
            user_id: socket.user.id,
            message_id,
            session_id,
            timestamp: new Date().toISOString()
        });
    });
};