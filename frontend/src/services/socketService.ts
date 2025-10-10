import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'https://capstone-patientpassport.onrender.com', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join access requests room
  joinAccessRequests() {
    if (this.socket) {
      this.socket.emit('join_access_requests');
    }
  }

  // Join patient notifications room
  joinPatientNotifications() {
    if (this.socket) {
      this.socket.emit('join_patient_notifications');
    }
  }

  // Join doctor notifications room
  joinDoctorNotifications() {
    if (this.socket) {
      this.socket.emit('join_doctor_notifications');
    }
  }

  // Listen for access request notifications
  onAccessRequest(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('access_request', callback);
    }
  }

  // Listen for access response notifications
  onAccessResponse(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('access_response', callback);
    }
  }

  // Listen for general notifications
  onNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  // Listen for emergency notifications
  onEmergencyNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('emergency_access', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();













