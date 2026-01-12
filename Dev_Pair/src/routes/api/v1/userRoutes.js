// File: C:\Users\DEEPT\OneDrive\Documents\Antigravity\Dev_Pair\src\routes\api\v1\userRoutes.js
import express from 'express';
import {
    getUserById,
    searchUsers,
    getUserStats
} from '../../../../controllers/users/userController.js';  // 4 levels up
import { verifyAuth } from '../../../../middleware/authMiddleware.js';  // 4 levels up

const router = express.Router();

// All routes require authentication
router.use(verifyAuth);

// User management routes
router.get('/search', searchUsers);
router.get('/stats', getUserStats);
router.get('/:user_id', getUserById);

export default router;