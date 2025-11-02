import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isDisconnecting: boolean = false;

  connect(token: string) {
    // Disconnect existing socket if any
    if (this.socket) {
      this.disconnect();
    }

    this.token = token;
    this.isDisconnecting = false;
    
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'https://patientpassport-api.azurewebsites.net', {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isDisconnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      // Only nullify if intentionally disconnected
      if (this.isDisconnecting || reason === 'io server disconnect') {
        this.socket = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Handle errors during emit operations
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket && !this.isDisconnecting) {
      this.isDisconnecting = true;
      
      try {
        // Remove all listeners first to prevent events during disconnect
        this.socket.removeAllListeners();
        
        // Only disconnect if connected
        if (this.socket.connected) {
          this.socket.disconnect();
        }
      } catch (error) {
        console.error('Error during socket disconnect:', error);
      } finally {
        this.socket = null;
        this.isDisconnecting = false;
      }
    }
  }

  // Safe emit helper - checks connection state before emitting
  private safeEmit(event: string, data?: any): boolean {
    if (!this.socket || this.isDisconnecting) {
      console.warn(`Cannot emit ${event}: socket not available or disconnecting`);
      return false;
    }

    if (!this.socket.connected) {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error emitting ${event}:`, error);
      return false;
    }
  }

  // Join access requests room
  joinAccessRequests() {
    return this.safeEmit('join_access_requests');
  }

  // Join patient notifications room
  joinPatientNotifications() {
    return this.safeEmit('join_patient_notifications');
  }

  // Join doctor notifications room
  joinDoctorNotifications() {
    return this.safeEmit('join_doctor_notifications');
  }

  // Listen for access request notifications
  onAccessRequest(callback: (data: any) => void) {
    if (this.socket && !this.isDisconnecting) {
      this.socket.on('access_request', callback);
    }
  }

  // Listen for access response notifications
  onAccessResponse(callback: (data: any) => void) {
    if (this.socket && !this.isDisconnecting) {
      this.socket.on('access_response', callback);
    }
  }

  // Listen for general notifications
  onNotification(callback: (data: any) => void) {
    if (this.socket && !this.isDisconnecting) {
      this.socket.on('notification', callback);
    }
  }

  // Listen for emergency notifications
  onEmergencyNotification(callback: (data: any) => void) {
    if (this.socket && !this.isDisconnecting) {
      this.socket.on('emergency_access', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket && !this.isDisconnecting) {
      try {
        this.socket.removeAllListeners();
      } catch (error) {
        console.error('Error removing listeners:', error);
      }
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected === true && !this.isDisconnecting;
  }
}

export default new SocketService();













