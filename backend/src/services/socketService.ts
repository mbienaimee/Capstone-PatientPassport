import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * Socket Service - Real-time Communication
 * 
 * Provides real-time notifications and updates via WebSocket
 * Note: USSD uses HTTP POST callbacks (separate from Socket.io)
 * Socket.io is for frontend real-time features only
 */

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    console.log('🔌 Initializing Socket.io for real-time features...');
    
    // Create Socket.io instance with proper CORS configuration
    this.io = new SocketIOServer(server, {
      path: '/socket.io',
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173', 'https://jade-pothos-e432d0.netlify.app'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });
    
    // Handle socket connections
    this.io.on('connection', (socket: Socket) => {
      console.log('✅ Socket connected:', socket.id);
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket) {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.warn('⚠️  Socket connection without token:', socket.id);
      socket.disconnect();
      return;
    }

    // Store user connection
    const userId = this.getUserIdFromToken(token);
    if (userId) {
      this.connectedUsers.set(socket.id, userId);
      console.log(`👤 User ${userId} connected (socket: ${socket.id})`);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      this.connectedUsers.delete(socket.id);
      console.log(`👋 Socket disconnected: ${socket.id}`);
    });

    // Handle custom events
    socket.on('join', (room: string) => {
      socket.join(room);
      console.log(`📍 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave', (room: string) => {
      socket.leave(room);
      console.log(`🚪 Socket ${socket.id} left room: ${room}`);
    });
  }

  /**
   * Extract user ID from JWT token
   */
  private getUserIdFromToken(token: string): string | null {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return decoded.id || decoded._id || null;
    } catch (error) {
      console.error('❌ Invalid token:', error);
      return null;
    }
  }
  
  disconnect() {
    if (this.io) {
      this.io.close();
      console.log('Socket.io server closed');
    }
  }

  joinAccessRequests() {
    return true;
  }

  joinPatientNotifications() {
    return true;
  }

  joinDoctorNotifications() {
    return true;
  }

  onAccessRequest(_callback: (data: any) => void) {
    // Implementation handled via socket.io events
  }

  onAccessResponse(_callback: (data: any) => void) {
    // Implementation handled via socket.io events
  }

  onNotification(_callback: (data: any) => void) {
    // Implementation handled via socket.io events
  }

  onEmergencyNotification(_callback: (data: any) => void) {
    // Implementation handled via socket.io events
  }

  removeAllListeners() {
    if (this.io) {
      this.io.removeAllListeners();
    }
  }

  getSocket() {
    return this.io;
  }

  isConnected() {
    return this.io !== null;
  }

  emitNotification(userId: string, data: any) {
    if (!this.io) return false;
    
    // Find user's socket
    const socketId = Array.from(this.connectedUsers.entries())
      .find(([_, uid]) => uid === userId)?.[0];
    
    if (socketId) {
      this.io.to(socketId).emit('notification', data);
      return true;
    }
    return false;
  }

  emitAccessRequest(userId: string, data: any) {
    if (!this.io) return false;
    
    const socketId = Array.from(this.connectedUsers.entries())
      .find(([_, uid]) => uid === userId)?.[0];
    
    if (socketId) {
      this.io.to(socketId).emit('accessRequest', data);
      return true;
    }
    return false;
  }

  emitAccessResponse(userId: string, data: any) {
    if (!this.io) return false;
    
    const socketId = Array.from(this.connectedUsers.entries())
      .find(([_, uid]) => uid === userId)?.[0];
    
    if (socketId) {
      this.io.to(socketId).emit('accessResponse', data);
      return true;
    }
    return false;
  }

  emitEmergencyAccess(userIds: string[], data: any) {
    if (!this.io) return false;
    
    userIds.forEach(userId => {
      const socketId = Array.from(this.connectedUsers.entries())
        .find(([_, uid]) => uid === userId)?.[0];
      
      if (socketId) {
        this.io!.to(socketId).emit('emergencyAccess', data);
      }
    });
    return true;
  }

  getUserSocket(userId: string) {
    const socketId = Array.from(this.connectedUsers.entries())
      .find(([_, uid]) => uid === userId)?.[0];
    return socketId || null;
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  broadcastToAdmins(event: string, data: any) {
    if (!this.io) return false;
    this.io.emit(event, data);
    return true;
  }

  broadcastToHospital(hospitalId: string, event: string, data: any) {
    if (!this.io) return false;
    this.io.to(`hospital:${hospitalId}`).emit(event, data);
    return true;
  }

  getIO() {
    return this.io;
  }
}

export default SocketService;
