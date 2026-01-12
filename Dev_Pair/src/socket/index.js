import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import { verifySocketAuth } from './authHandlers.js';
import { handleWebRTCEvents } from './handlers/webrtcHandlers.js';
import { handleChatEvents } from './handlers/chatHandlers.js';
import { handleSessionEvents } from './handlers/sessionHandlers.js';

// Store active connections
const activeConnections = new Map();
const activeSessions = new Map();

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST']
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
            skipMiddlewares: true
        }
    });

    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const user = await verifySocketAuth(token);
            if (!user) {
                return next(new Error('Invalid authentication token'));
            }

            socket.user = user;
            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        logger.info('New socket connection:', {
            socketId: socket.id,
            userId: socket.user?.id
        });

        // Store connection
        activeConnections.set(socket.id, {
            socket,
            user: socket.user,
            joinedAt: new Date(),
            sessions: new Set()
        });

        // Setup event handlers
        setupEventHandlers(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            handleDisconnection(socket, reason);
        });

        // Handle errors
        socket.on('error', (error) => {
            logger.error('Socket error:', { socketId: socket.id, error });
        });
    });

    return io;
};

const setupEventHandlers = (socket) => {
    // Authentication events
    socket.on('authenticate', (data) => {
        socket.emit('authenticated', {
            success: true,
            socketId: socket.id,
            user: socket.user
        });
    });

    // Session events
    handleSessionEvents(socket, activeSessions);

    // WebRTC events
    handleWebRTCEvents(socket);

    // Chat events
    handleChatEvents(socket);

    // Media control events
    socket.on('screen-sharing', (data) => {
        const { session_id, isSharing } = data;
        socket.to(session_id).emit('screen-sharing', {
            user_id: socket.user.id,
            isSharing,
            session_id
        });
    });

    socket.on('audio-toggle', (data) => {
        const { session_id, isMuted } = data;
        socket.to(session_id).emit('audio-toggle', {
            user_id: socket.user.id,
            isMuted,
            session_id
        });
    });

    socket.on('video-toggle', (data) => {
        const { session_id, isVideoOff } = data;
        socket.to(session_id).emit('video-toggle', {
            user_id: socket.user.id,
            isVideoOff,
            session_id
        });
    });

    // Whiteboard events
    socket.on('whiteboard-draw', (data) => {
        const { session_id, ...drawData } = data;
        socket.to(session_id).emit('whiteboard-draw', {
            ...drawData,
            user_id: socket.user.id,
            session_id
        });
    });

    socket.on('whiteboard-clear', ({ session_id }) => {
        socket.to(session_id).emit('whiteboard-clear', {
            cleared_by: socket.user.id,
            session_id
        });
    });

    // Poll events
    socket.on('create-poll', ({ session_id, poll }) => {
        socket.to(session_id).emit('new-poll', {
            poll,
            created_by: socket.user.id,
            session_id
        });
    });

    socket.on('vote-poll', ({ session_id, poll_id, option_id }) => {
        socket.to(session_id).emit('poll-vote', {
            poll_id,
            option_id,
            voted_by: socket.user.id,
            session_id
        });
    });
};

const handleDisconnection = (socket, reason) => {
    logger.info('Socket disconnected:', {
        socketId: socket.id,
        userId: socket.user?.id,
        reason
    });

    // Remove from all sessions
    const connection = activeConnections.get(socket.id);
    if (connection) {
        connection.sessions.forEach(sessionId => {
            const session = activeSessions.get(sessionId);
            if (session) {
                session.delete(socket.user.id);
                if (session.size === 0) {
                    activeSessions.delete(sessionId);
                }

                // Notify others
                socket.to(sessionId).emit('user-disconnected', {
                    user_id: socket.user.id,
                    session_id: sessionId
                });
            }
        });
    }

    // Remove connection
    activeConnections.delete(socket.id);
};

// Utility functions
export const getActiveSessions = () => {
    return Array.from(activeSessions.entries()).map(([sessionId, participants]) => ({
        sessionId,
        participants: Array.from(participants).map(userId => {
            const connection = Array.from(activeConnections.values())
                .find(c => c.user.id === userId);
            return connection ? connection.user : null;
        }).filter(Boolean)
    }));
};

export const getSessionParticipants = (sessionId) => {
    const session = activeSessions.get(sessionId);
    return session ? Array.from(session).map(userId => {
        const connection = Array.from(activeConnections.values())
            .find(c => c.user.id === userId);
        return connection ? connection.user : null;
    }).filter(Boolean) : [];
};