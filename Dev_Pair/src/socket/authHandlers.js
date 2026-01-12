import { supabase } from '../config/supabase.js';

export const verifySocketAuth = async (token) => {
    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
            return null;
        }

        // Get additional user data
        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return {
            ...data.user,
            profile: userProfile || {}
        };
    } catch (error) {
        console.error('Socket auth verification error:', error);
        return null;
    }
};