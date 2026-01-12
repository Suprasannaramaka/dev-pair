import { supabase } from '../../config/supabase.js';
import webrtcConfig from '../../config/webrtc.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

// Get ICE servers for WebRTC
export const getIceServers = async (req, res) => {
    try {
        return successResponse(res, {
            iceServers: webrtcConfig.iceServers,
            configuration: {
                iceCandidatePoolSize: webrtcConfig.iceCandidatePoolSize,
                iceTransportPolicy: webrtcConfig.iceTransportPolicy
            }
        }, 'ICE servers retrieved');
    } catch (error) {
        logger.error('Get ICE servers error:', error);
        return errorResponse(res, 'Failed to get ICE servers', 500);
    }
};

// Generate session token for WebRTC
export const generateSessionToken = async (req, res) => {
    try {
        const { session_id } = req.body;
        const user = req.user;

        if (!session_id) {
            return errorResponse(res, 'Session ID is required', 400);
        }

        // Verify session access
        const { data: session, error } = await supabase
            .from('sessions')
            .select(`
        *,
        mentor:mentor_id(id, name),
        student:student_id(id, name)
      `)
            .eq('id', session_id)
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .single();

        if (error || !session) {
            return errorResponse(res, 'Access denied to this session', 403);
        }

        // Check session status
        if (session.status !== 'active') {
            return errorResponse(res, `Session is ${session.status}. Cannot join WebRTC call.`, 400);
        }

        // Generate token data
        const tokenData = {
            user_id: user.id,
            session_id,
            role: user.user_metadata?.role || user.profile?.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        };

        const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

        logger.info('WebRTC session token generated', {
            userId: user.id,
            sessionId: session_id,
            role: tokenData.role
        });

        return successResponse(res, {
            token,
            session: {
                id: session.id,
                title: session.title,
                status: session.status
            },
            user: {
                id: user.id,
                name: user.user_metadata?.name || user.profile?.name,
                role: user.user_metadata?.role || user.profile?.role
            },
            expires_in: 86400
        }, 'Session token generated');

    } catch (error) {
        logger.error('Generate session token error:', error);
        return errorResponse(res, 'Failed to generate session token', 500);
    }
};

// Get session participants
export const getSessionParticipants = async (req, res) => {
    try {
        const { session_id } = req.params;
        const user = req.user;

        // Verify session access
        const { data: session, error } = await supabase
            .from('sessions')
            .select(`
        *,
        mentor:mentor_id(id, name, email, image, role),
        student:student_id(id, name, email, image, role)
      `)
            .eq('id', session_id)
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .single();

        if (error || !session) {
            return errorResponse(res, 'Access denied to this session', 403);
        }

        const participants = [];

        if (session.mentor) {
            participants.push({
                ...session.mentor,
                joined: true,
                is_online: false // Would be populated from socket connections in real implementation
            });
        }

        if (session.student) {
            participants.push({
                ...session.student,
                joined: true,
                is_online: false
            });
        }

        logger.info('Session participants retrieved', {
            sessionId: session_id,
            participantCount: participants.length
        });

        return successResponse(res, {
            participants,
            session: {
                id: session.id,
                title: session.title,
                status: session.status,
                created_at: session.created_at
            }
        }, 'Participants retrieved');

    } catch (error) {
        logger.error('Get participants error:', error);
        return errorResponse(res, 'Failed to get participants', 500);
    }
};

// Save chat message
export const saveChatMessage = async (req, res) => {
    try {
        const { session_id, message, sender_name } = req.body;
        const user = req.user;

        if (!session_id || !message) {
            return errorResponse(res, 'Session ID and message are required', 400);
        }

        // Verify session access
        const { data: session } = await supabase
            .from('sessions')
            .select('id')
            .eq('id', session_id)
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .single();

        if (!session) {
            return errorResponse(res, 'Access denied to this session', 403);
        }

        // Save chat message
        const { data, error } = await supabase
            .from('session_chats')
            .insert({
                session_id,
                message,
                sender_id: user.id,
                sender_name: sender_name || user.user_metadata?.name || user.profile?.name,
                timestamp: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        logger.info('Chat message saved', {
            sessionId: session_id,
            userId: user.id,
            messageLength: message.length
        });

        return successResponse(res, { chat: data }, 'Chat message saved');

    } catch (error) {
        logger.error('Save chat message error:', error);
        return errorResponse(res, 'Failed to save chat message', 500);
    }
};

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const { session_id } = req.params;
        const user = req.user;
        const { limit = 50, offset = 0 } = req.query;

        // Verify session access
        const { data: session } = await supabase
            .from('sessions')
            .select('id')
            .eq('id', session_id)
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .single();

        if (!session) {
            return errorResponse(res, 'Access denied to this session', 403);
        }

        // Get chat messages
        const { data: chats, error } = await supabase
            .from('session_chats')
            .select('*')
            .eq('session_id', session_id)
            .order('timestamp', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) throw error;

        logger.info('Chat history retrieved', {
            sessionId: session_id,
            messageCount: chats?.length || 0
        });

        return successResponse(res, {
            chats: chats || [],
            count: chats?.length || 0
        }, 'Chat history retrieved');

    } catch (error) {
        logger.error('Get chat history error:', error);
        return errorResponse(res, 'Failed to get chat history', 500);
    }
};

// Get WebRTC stats
export const getWebRTCStats = async (req, res) => {
    try {
        const { session_id } = req.query;
        const user = req.user;

        let stats = {
            timestamp: new Date().toISOString(),
            ice_servers_count: webrtcConfig.iceServers.length
        };

        if (session_id) {
            // Verify session access
            const { data: session } = await supabase
                .from('sessions')
                .select('id, title, status, started_at, ended_at')
                .eq('id', session_id)
                .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
                .single();

            if (!session) {
                return errorResponse(res, 'Access denied to this session', 403);
            }

            stats.session = {
                id: session.id,
                title: session.title,
                status: session.status,
                duration_minutes: session.started_at
                    ? Math.floor((new Date() - new Date(session.started_at)) / 60000)
                    : 0
            };
        }

        return successResponse(res, { stats }, 'WebRTC stats retrieved');

    } catch (error) {
        logger.error('Get WebRTC stats error:', error);
        return errorResponse(res, 'Failed to get WebRTC stats', 500);
    }
};