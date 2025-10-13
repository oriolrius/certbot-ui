import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import logger from '../utils/logger';
import { verifyToken, JwtPayload } from '../middleware/auth';

export interface WebSocketMessage {
  type: string;
  payload: unknown;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      logger.info('WebSocket client connected');

      // Extract token from query string
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      try {
        const user = verifyToken(token);
        this.addClient(user.id, ws);

        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString()) as WebSocketMessage;
            this.handleMessage(user, ws, message);
          } catch (error) {
            logger.error(`WebSocket message error: ${error}`);
          }
        });

        ws.on('close', () => {
          logger.info(`WebSocket client disconnected: ${user.username}`);
          this.removeClient(user.id, ws);
        });

        ws.on('error', (error) => {
          logger.error(`WebSocket error: ${error}`);
        });

        // Send welcome message
        this.sendToClient(ws, {
          type: 'connected',
          payload: { message: 'Connected to Certbot UI' },
        });
      } catch (error) {
        logger.error(`WebSocket authentication error: ${error}`);
        ws.close(1008, 'Invalid token');
      }
    });

    logger.info('WebSocket server initialized');
  }

  private addClient(userId: string, ws: WebSocket): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)?.add(ws);
  }

  private removeClient(userId: string, ws: WebSocket): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private handleMessage(user: JwtPayload, ws: WebSocket, message: WebSocketMessage): void {
    logger.info(`Received message from ${user.username}: ${message.type}`);

    // Handle ping/pong
    if (message.type === 'ping') {
      this.sendToClient(ws, { type: 'pong', payload: {} });
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WebSocketMessage, userId?: string): void {
    if (userId) {
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.forEach((ws) => this.sendToClient(ws, message));
      }
    } else {
      // Broadcast to all clients
      this.clients.forEach((userClients) => {
        userClients.forEach((ws) => this.sendToClient(ws, message));
      });
    }
  }

  sendOperationProgress(userId: string, operation: string, progress: number, message: string): void {
    this.broadcast(
      {
        type: 'operation_progress',
        payload: { operation, progress, message },
      },
      userId
    );
  }

  sendOperationComplete(userId: string, operation: string, success: boolean, data?: unknown): void {
    this.broadcast(
      {
        type: 'operation_complete',
        payload: { operation, success, data },
      },
      userId
    );
  }

  sendCertificateUpdate(userId: string, event: string, certificate: unknown): void {
    this.broadcast(
      {
        type: 'certificate_update',
        payload: { event, certificate },
      },
      userId
    );
  }
}

export default new WebSocketService();
