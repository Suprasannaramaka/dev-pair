import express from 'express';
import {
    createSession,
    joinSession,
    getSessionDetails,
    getSessionHistory,
    endSession,
    cancelSession
} from '../../../controllers/sessions/sessionController.js';
import { verifyAuth } from '../../../middleware/authMiddleware.js';
import {
    validateCreateSession,
    validateSessionId
} from '../../../middleware/validationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyAuth);

// Session management
router.post('/create', validateCreateSession, createSession);
router.post('/join/:sessionId', validateSessionId, joinSession);
router.get('/history', getSessionHistory);
router.get('/:sessionId', validateSessionId, getSessionDetails);
router.post('/end/:sessionId', validateSessionId, endSession);
router.post('/cancel/:sessionId', validateSessionId, cancelSession);

export default router;