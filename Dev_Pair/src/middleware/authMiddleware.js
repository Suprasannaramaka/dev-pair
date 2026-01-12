import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';

export const verifyAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Verify token with Supabase
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            logger.warn('Invalid authentication token', { error: error?.message });
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authentication token'
            });
        }

        // Get additional user data from database
        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        // Attach user to request
        req.user = {
            ...data.user,
            profile: userProfile || {}
        };

        logger.info('User authenticated', { userId: data.user.id });
        next();
    } catch (error) {
        logger.error('Authentication error', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Authentication server error'
        });
    }
};

export const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.user_metadata?.role || req.user.profile?.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};