import { supabase } from '../../config/supabase.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

// Get user profile by ID
export const getUserById = async (req, res) => {
    try {
        const { user_id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, image, role, bio, skills, experience, availability, created_at')
            .eq('id', user_id)
            .single();

        if (error || !user) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, { user }, 'User profile retrieved');

    } catch (error) {
        logger.error('Get user by ID error:', error);
        return errorResponse(res, 'Failed to get user profile', 500);
    }
};

// Search users
export const searchUsers = async (req, res) => {
    try {
        const { query, role, limit = 10, offset = 0 } = req.query;
        const user = req.user;

        let searchQuery = supabase
            .from('users')
            .select('id, name, email, image, role, bio, skills, created_at', { count: 'exact' })
            .neq('id', user.id) // Exclude current user
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (query) {
            searchQuery = searchQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,bio.ilike.%${query}%`);
        }

        if (role) {
            searchQuery = searchQuery.eq('role', role);
        }

        const { data: users, error, count } = await searchQuery;

        if (error) throw error;

        logger.info('Users searched', {
            query,
            role,
            resultCount: users?.length || 0
        });

        return paginatedResponse(res, users || [], {
            total: count || 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < (count || 0)
        }, 'Users search results');

    } catch (error) {
        logger.error('Search users error:', error);
        return errorResponse(res, 'Failed to search users', 500);
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const user = req.user;

        // Get session counts
        const { count: totalSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`);

        const { count: completedSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .eq('status', 'ended');

        const { count: upcomingSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .eq('status', 'active');

        // Get session durations
        const { data: sessions } = await supabase
            .from('sessions')
            .select('started_at, ended_at')
            .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
            .not('started_at', 'is', null)
            .not('ended_at', 'is', null);

        let totalDuration = 0;
        sessions?.forEach(session => {
            const duration = new Date(session.ended_at) - new Date(session.started_at);
            totalDuration += duration;
        });

        logger.info('User stats retrieved', { userId: user.id });

        return successResponse(res, {
            stats: {
                total_sessions: totalSessions || 0,
                completed_sessions: completedSessions || 0,
                upcoming_sessions: upcomingSessions || 0,
                total_duration_minutes: Math.floor(totalDuration / 60000),
                average_session_minutes: sessions?.length
                    ? Math.floor((totalDuration / sessions.length) / 60000)
                    : 0
            }
        }, 'User statistics retrieved');

    } catch (error) {
        logger.error('Get user stats error:', error);
        return errorResponse(res, 'Failed to get user statistics', 500);
    }
};