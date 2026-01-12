import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error details
    logger.error('Error middleware caught:', {
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal server error'
            : message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

export default errorMiddleware;