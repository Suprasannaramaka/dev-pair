import express from 'express';
import {
    signup,
    login,
    logout,
    getProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    sendResetPassword,
    updatePassword
} from '../../../controllers/auth/authController.js';
import { verifyAuth } from '../../../middleware/authMiddleware.js';
import upload, { handleUploadError } from '../../../middleware/uploadMiddleware.js';
import {
    validateSignup,
    validateLogin,
    validateUpdateProfile
} from '../../../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/reset-password', sendResetPassword);

// Protected routes
router.get('/profile', verifyAuth, getProfile);
router.put('/profile', verifyAuth, validateUpdateProfile, updateProfile);
router.post('/upload-image',
    verifyAuth,
    upload.single('image'),
    handleUploadError,
    uploadProfileImage
);
router.delete('/delete-image', verifyAuth, deleteProfileImage);
router.post('/update-password', verifyAuth, updatePassword);

export default router;