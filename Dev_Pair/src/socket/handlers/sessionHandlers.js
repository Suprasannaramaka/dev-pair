import { activeSessions, activeConnections } from '../index.js';
import logger from '../../utils/logger.js';

export const handleSessionEvents = (socket, activeSessions) => {
    // Join session
    socket.on('join-session', ({ session_id, user_id, role }) => {
        try {
            socket.join(session_id);
            socket.sessionId = session_id;

            // Store in active sessions
            if (!activeSessions.has(session_id)) {
                activeSessions.set(session_id, new Set());
            }
            activeSessions.get(session_id).add(user_id);

            // Store in connection
            const connection = activeConnections.get(socket.id);
            if (connection) {
                connection.sessions.add(session_id);
            }

            // Get existing participants
            const session = activeSessions.get(session_id);
            const participants = Array.from(session)
                .filter(id => id !== user_id)
                .map(userId => {
                    const conn = Array.from(activeConnections.values())
                        .find(c => c.user.id === userId);
                    return conn ? {
                        user_id: conn.user.id,
                        socket_id: conn.socket.id,
                        name: conn.user.user_metadata?.name || conn.user.profile?.name,
                        role: conn.user.user_metadata?.role || conn.user.profile?.role
                    } : null;
                })
                .filter(Boolean);

            // Send existing participants to new user
            socket.emit('session-participants', {
                session_id,
                participants
            });

            // Notify others about new user
            socket.to(session_id).emit('user-joined', {
                user_id,
                socket_id: socket.id,
                name: socket.user.user_metadata?.name || socket.user.profile?.name,
                role: socket.user.user_metadata?.role || socket.user.profile?.role,
                session_id
            });

            logger.info('User joined session', {
                session_id,
                user_id,
                participants_count: session.size
            });
        } catch (error) {
            logger.error('Error joining session:', error);
            socket.emit('join-error', { message: 'Failed to join session' });
        }
    });

    // Leave session
    socket.on('leave-session', ({ session_id }) => {
        try {
            socket.leave(session_id);

            // Remove from active sessions
            if (activeSessions.has(session_id)) {
                const session = activeSessions.get(session_id);
                session.delete(socket.user.id);

                if (session.size === 0) {
                    activeSessions.delete(session_id);
                }
            }

            // Remove from connection
            const connection = activeConnections.get(socket.id);
            if (connection) {
                connection.sessions.delete(session_id);
            }

            // Notify others
            socket.to(session_id).emit('user-left', {
                user_id: socket.user.id,
                session_id
            });

            logger.info('User left session', {
                session_id,
                user_id: socket.user.id
            });
        } catch (error) {
            logger.error('Error leaving session:', error);
        }
    });

    // Raise hand
    socket.on('raise-hand', ({ session_id, isRaised }) => {
        socket.to(session_id).emit('raise-hand', {
            user_id: socket.user.id,
            isRaised,
            session_id,
            timestamp: new Date().toISOString()
        });
    });
};