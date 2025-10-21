import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://jade-pothos-e432d0.netlify.app',
      'https://patientpassport-api.azurewebsites.net',
      process.env['FRONTEND_URL'],
      process.env['CORS_ORIGIN']
    ].filter(Boolean);

    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId!, socket.id);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Handle access request notifications
      socket.on('join_access_requests', () => {
        socket.join('access_requests');
        console.log(`User ${socket.userId} joined access requests room`);
      });

      // Handle patient notifications
      socket.on('join_patient_notifications', () => {
        socket.join('patient_notifications');
        console.log(`User ${socket.userId} joined patient notifications room`);
      });

      // Handle doctor notifications
      socket.on('join_doctor_notifications', () => {
        socket.join('doctor_notifications');
        console.log(`User ${socket.userId} joined doctor notifications room`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId!);
      });
    });
  }

  // Send notification to specific user
  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`Sent ${event} to user ${userId}`);
    } else {
      console.log(`User ${userId} is not connected`);
    }
  }

  // Send notification to user's room
  public sendToUserRoom(userId: string, event: string, data: any) {
    this.io.to(`user_${userId}`).emit(event, data);
    console.log(`Sent ${event} to user room ${userId}`);
  }

  // Send notification to all users in a room
  public sendToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
    console.log(`Sent ${event} to room ${room}`);
  }

  // Send access request notification to patient
  public sendAccessRequestNotification(patientId: string, requestData: any) {
    this.sendToUserRoom(patientId, 'access_request', {
      type: 'access_request',
      title: 'New Access Request',
      message: `A doctor is requesting access to your medical records.`,
      data: requestData,
      timestamp: new Date()
    });
  }

  // Send access response notification to doctor
  public sendAccessResponseNotification(doctorId: string, responseData: any) {
    this.sendToUserRoom(doctorId, 'access_response', {
      type: 'access_response',
      title: 'Access Request Response',
      message: `Your access request has been ${responseData.status}.`,
      data: responseData,
      timestamp: new Date()
    });
  }

  // Send general notification
  public sendNotification(userId: string, notification: any) {
    this.sendToUserRoom(userId, 'notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Send emergency notification
  public sendEmergencyNotification(patientId: string, emergencyData: any) {
    this.sendToUserRoom(patientId, 'emergency_access', {
      type: 'emergency_access',
      title: 'Emergency Access Granted',
      message: 'A doctor has been granted emergency access to your medical records.',
      data: emergencyData,
      priority: 'urgent',
      timestamp: new Date()
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get all connected users
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}

export default SocketService;
