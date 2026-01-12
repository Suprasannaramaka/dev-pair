import { body, param, query, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Auth validation rules
export const validateSignup = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['student', 'mentor']).withMessage('Role must be student or mentor'),
    validateRequest
];

export const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
];

// Session validation rules
export const validateCreateSession = [
    body('title').trim().notEmpty().withMessage('Session title is required'),
    body('description').optional().trim(),
    validateRequest
];

export const validateSessionId = [
    param('sessionId').isUUID().withMessage('Valid session ID is required'),
    validateRequest
];

// Profile validation rules
export const validateUpdateProfile = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('bio').optional().trim(),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('experience').optional().trim(),
    validateRequest
];

// WebRTC validation rules
export const validateSessionToken = [
    body('session_id').isUUID().withMessage('Valid session ID is required'),
    validateRequest
];

export const validateChatMessage = [
    body('message').trim().notEmpty().withMessage('Message cannot be empty'),
    body('session_id').isUUID().withMessage('Valid session ID is required'),
    validateRequest
];