import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * Socket Service - DISABLED
 * 
 * Socket.io is disabled to prevent conflicts with Africa's Talking USSD simulator
 * Africa's Talking uses HTTP POST callbacks only, not WebSockets
 * 
 * All real-time features are disabled. Use REST API polling instead.
 */

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    console.log('⚠️  Socket.io is DISABLED (prevents Africa\'s Talking simulator conflicts)');
    console.log('ℹ️  USSD works via HTTP POST /api/ussd/callback');
    console.log('ℹ️  Use REST API polling for notifications');
    
    // Create minimal socket.io instance that blocks all connections
    this.io = new SocketIOServer(server, {
      path: '/socket.io-disabled', // Different path to prevent conflicts
      cors: { origin: false }, // Block all CORS
      transports: [], // No transports = no connections
      allowEIO3: false
    });
    
    // If somehow a connection is made, disconnect it immediately
    this.io.on('connection', (socket: Socket) => {
      console.warn('⚠️  Unexpected socket connection attempt - disconnecting');
      socket.emit('error', 'Socket.io is disabled. Use REST API.');
      socket.disconnect(true);
    });
  }

  // All methods below are no-ops (do nothing)
  
  disconnect() {
    // No-op
  }

  joinAccessRequests() {
    return false;
  }

  joinPatientNotifications() {
    return false;
  }

  joinDoctorNotifications() {
    return false;
  }

  onAccessRequest(_callback: (data: any) => void) {
    // No-op
  }

  onAccessResponse(_callback: (data: any) => void) {
    // No-op
  }

  onNotification(_callback: (data: any) => void) {
    // No-op
  }

  onEmergencyNotification(_callback: (data: any) => void) {
    // No-op
  }

  removeAllListeners() {
    // No-op
  }

  getSocket() {
    return null;
  }

  isConnected() {
    return false;
  }

  emitNotification(_userId: string, _data: any) {
    // No-op - notifications disabled
    return false;
  }

  emitAccessRequest(_userId: string, _data: any) {
    // No-op
    return false;
  }

  emitAccessResponse(_userId: string, _data: any) {
    // No-op
    return false;
  }

  emitEmergencyAccess(_userIds: string[], _data: any) {
    // No-op
    return false;
  }

  getUserSocket(_userId: string) {
    return null;
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  broadcastToAdmins(_event: string, _data: any) {
    // No-op
    return false;
  }

  broadcastToHospital(_hospitalId: string, _event: string, _data: any) {
    // No-op
    return false;
  }

  getIO() {
    return this.io;
  }
}

export default SocketService;
