import express, { Application } from 'express';
import http from 'http';
import config from './config';
import logger from './utils/logger';
import {
  helmetMiddleware,
  corsMiddleware,
  rateLimiter,
  requestLogger,
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import websocketService from './services/websocket.service';

const app: Application = express();
const server = http.createServer(app);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', routes);

// Health check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Certbot UI API',
    version: '1.0.0',
  });
});

// Initialize WebSocket
websocketService.initialize(server);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`WebSocket available at ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, server };
