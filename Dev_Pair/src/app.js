import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import errorMiddleware from './middleware/errorMiddleware.js';

// Import routes
import authRoutes from './routes/api/v1/authRoutes.js';
import sessionRoutes from './routes/api/v1/sessionRoutes.js';
import webrtcRoutes from './routes/api/v1/webrtcRoutes.js';
import userRoutes from './routes/api/v1/userRoutes.js';
import adminRoutes from './routes/api/v1/adminRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'mentorship-platform',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/webrtc', webrtcRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// API Documentation
app.get('/api', (req, res) => {
    res.json({
        name: 'Mentorship Platform API',
        version: '1.0.0',
        documentation: 'https://github.com/yourusername/mentorship-platform',
        endpoints: {
            auth: '/api/v1/auth',
            sessions: '/api/v1/sessions',
            webrtc: '/api/v1/webrtc',
            users: '/api/v1/users',
            admin: '/api/v1/admin'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware (should be last)
app.use(errorMiddleware);

export default app;