import { supabase, supabaseAdmin } from '../../config/supabase.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import { generateFileName } from '../../utils/helpers.js';
import { uploadToSupabase, deleteFromSupabase } from '../../services/storage/fileService.js';

// Signup controller
export const signup = async (req, res) => {
    try {
        const { email, password, name, role = 'student' } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return errorResponse(res, 'Email, password, and name are required', 400);
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return errorResponse(res, 'User already exists with this email', 409);
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role,
                    email_verified: false
                }
            }
        });

        if (authError) {
            logger.error('Signup auth error:', authError);
            return errorResponse(res, authError.message, 400);
        }

        const userId = authData.user.id;

        // Create user in custom users table
        const { error: profileError } = await supabase
            .from('users')
            .insert([
                {
                    id: userId,
                    name,
                    email,
                    role,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]);

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            logger.error('Profile creation error:', profileError);
            return errorResponse(res, 'Failed to create user profile', 500);
        }

        // Send verification email
        await supabase.auth.resend({
            type: 'signup',
            email: email
        });

        logger.info('User signed up successfully', { userId, email, role });

        return successResponse(res, {
            user: {
                id: userId,
                email,
                name,
                role
            },
            message: 'Please check your email for verification'
        }, 'Signup successful', 201);

    } catch (error) {
        logger.error('Signup error:', error);
        return errorResponse(res, 'Internal server error during signup', 500);
    }
};

// Login controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            logger.warn('Login failed:', { email, error: error.message });
            return errorResponse(res, 'Invalid email or password', 401);
        }

        const { user, session } = data;

        // Get user profile
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        // Set cookie
        res.cookie('token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        logger.info('User logged in', { userId: user.id, email });

        return successResponse(res, {
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || profile?.name,
                role: user.user_metadata?.role || profile?.role,
                image: user.user_metadata?.image || profile?.image
            },
            session: {
                access_token: session.access_token,
                expires_at: session.expires_at
            }
        }, 'Login successful');

    } catch (error) {
        logger.error('Login error:', error);
        return errorResponse(res, 'Internal server error during login', 500);
    }
};

// Logout controller
export const logout = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (token) {
            await supabase.auth.signOut();
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        logger.info('User logged out', { userId: req.user?.id });

        return successResponse(res, null, 'Logged out successfully');

    } catch (error) {
        logger.error('Logout error:', error);
        return errorResponse(res, 'Internal server error during logout', 500);
    }
};

// Get profile controller
export const getProfile = async (req, res) => {
    try {
        const user = req.user;

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        return successResponse(res, {
            ...profile,
            metadata: user.user_metadata
        }, 'Profile retrieved successfully');

    } catch (error) {
        logger.error('Get profile error:', error);
        return errorResponse(res, 'Failed to retrieve profile', 500);
    }
};

// Update profile controller
export const updateProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const { name, bio, skills, experience, availability } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (skills !== undefined) updates.skills = skills;
        if (experience !== undefined) updates.experience = experience;
        if (availability !== undefined) updates.availability = availability;
        updates.updated_at = new Date().toISOString();

        // Update custom users table
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update auth metadata if name changed
        if (name) {
            await supabaseAdmin.auth.admin.updateUserById(id, {
                user_metadata: { name }
            });
        }

        logger.info('Profile updated', { userId: id });

        return successResponse(res, data, 'Profile updated successfully');

    } catch (error) {
        logger.error('Update profile error:', error);
        return errorResponse(res, 'Failed to update profile', 500);
    }
};

// Upload profile image controller
export const uploadProfileImage = async (req, res) => {
    try {
        const { id } = req.user;
        const file = req.file;

        if (!file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        // Generate filename
        const fileName = generateFileName(id, file.originalname);

        // Upload to Supabase Storage
        const imageUrl = await uploadToSupabase(
            'profile_image',
            fileName,
            file.buffer,
            file.mimetype
        );

        // Update user record
        const { data, error } = await supabase
            .from('users')
            .update({ image: imageUrl })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update auth metadata
        await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: { image: imageUrl }
        });

        logger.info('Profile image uploaded', { userId: id });

        return successResponse(res, { image: imageUrl }, 'Profile image uploaded successfully');

    } catch (error) {
        logger.error('Upload profile image error:', error);
        return errorResponse(res, 'Failed to upload profile image', 500);
    }
};

// Delete profile image controller
export const deleteProfileImage = async (req, res) => {
    try {
        const { id } = req.user;

        // Get current image URL
        const { data: user } = await supabase
            .from('users')
            .select('image')
            .eq('id', id)
            .single();

        if (!user?.image) {
            return errorResponse(res, 'No profile image found', 404);
        }

        // Extract filename from URL
        const fileName = user.image.split('/').pop();

        // Delete from storage
        await deleteFromSupabase('profile_image', fileName);

        // Update user record
        await supabase
            .from('users')
            .update({ image: null })
            .eq('id', id);

        // Update auth metadata
        await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: { image: null }
        });

        logger.info('Profile image deleted', { userId: id });

        return successResponse(res, null, 'Profile image deleted successfully');

    } catch (error) {
        logger.error('Delete profile image error:', error);
        return errorResponse(res, 'Failed to delete profile image', 500);
    }
};

// Send password reset email
export const sendResetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return errorResponse(res, 'Email is required', 400);
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`
        });

        if (error) {
            logger.error('Reset password error:', error);
            return errorResponse(res, 'Failed to send reset password email', 500);
        }

        logger.info('Password reset email sent', { email });

        return successResponse(res, null, 'Password reset email sent successfully');

    } catch (error) {
        logger.error('Send reset password error:', error);
        return errorResponse(res, 'Internal server error', 500);
    }
};

// Update password
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        if (!currentPassword || !newPassword) {
            return errorResponse(res, 'Current and new password are required', 400);
        }

        if (newPassword.length < 6) {
            return errorResponse(res, 'New password must be at least 6 characters', 400);
        }

        // Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            return errorResponse(res, 'Current password is incorrect', 401);
        }

        // Update password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        logger.info('Password updated', { userId: user.id });

        return successResponse(res, null, 'Password updated successfully');

    } catch (error) {
        logger.error('Update password error:', error);
        return errorResponse(res, 'Failed to update password', 500);
    }
};