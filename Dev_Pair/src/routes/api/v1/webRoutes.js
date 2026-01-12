import express from 'express';
import {
    getIceServers,
    generateSessionToken,
    getSessionParticipants,
    saveChatMessage,
    getChatHistory,
    getWebRTCStats
} from '../../../controllers/webrtc/webrtcController.js';
import { verifyAuth } from '../../../middleware/authMiddleware.js';
import {
    validateSessionToken,
    validateChatMessage
} from '../../../middleware/validationMiddleware.js';

const router = express.Router();

// WebRTC configuration (public)
router.get('/ice-servers', getIceServers);

// Protected routes
router.use(verifyAuth);

// Session management
router.post('/session-token', validateSessionToken, generateSessionToken);
router.get('/participants/:session_id', getSessionParticipants);

// Chat management
router.post('/save-chat', validateChatMessage, saveChatMessage);
router.get('/chat-history/:session_id', getChatHistory);

// Statistics
router.get('/stats', getWebRTCStats);

export default router;