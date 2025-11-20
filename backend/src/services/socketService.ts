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
      'https://simulator.africastalking.com', // Africa's Talking USSD Simulator
      'https://account.africastalking.com', // Africa's Talking Dashboard
      process.env['FRONTEND_URL'],
      process.env['CORS_ORIGIN']
    ].filter(Boolean);

    // Public origins that don't require authentication (for USSD simulator, etc.)
    const publicOrigins = [
      'https://simulator.africastalking.com',
      'https://account.africastalking.com'
    ];

    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps, curl, Postman)
          if (!origin) return callback(null, true);
          
          // In development, allow all origins
          if (process.env['NODE_ENV'] === 'development') {
            return callback(null, true);
          }
          
          // Check against whitelist
          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            console.warn(`Blocked socket.io CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true, // Support older socket.io clients
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware(publicOrigins);
    this.setupEventHandlers();
  }

  private setupMiddleware(publicOrigins: string[]) {
    // Authentication middleware - allow public origins to connect without auth
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const origin = socket.handshake.headers.origin || '';
        
        // Allow public origins (like USSD simulator) to connect without authentication
        if (publicOrigins.some(publicOrigin => origin.includes(publicOrigin))) {
          console.log(`🔓 Public origin connected (no auth required): ${origin}`);
          // Allow connection but mark as unauthenticated
          socket.userId = undefined;
          socket.user = undefined;
          return next();
        }

        // For other origins, require authentication
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          console.warn(`❌ Socket connection rejected: No authentication token from origin: ${origin}`);
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          console.warn(`❌ Socket connection rejected: User not found for token from origin: ${origin}`);
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        console.log(`✅ Authenticated socket connection: User ${socket.userId} from origin: ${origin}`);
        next();
      } catch (error: any) {
        console.error(`❌ Socket authentication error: ${error.message}`);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const origin = socket.handshake.headers.origin || 'unknown';
      
      if (socket.userId) {
        console.log(`✅ Authenticated user ${socket.userId} connected with socket ${socket.id} from ${origin}`);
        
        // Store user connection
        this.connectedUsers.set(socket.userId, socket.id);

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
      } else {
        console.log(`🔓 Public connection (unauthenticated) from ${origin} with socket ${socket.id}`);
        
        // Allow public connections to join a public room for USSD simulator, etc.
        socket.join('public');
        
        // Handle public events if needed
        socket.on('ussd_simulator_ping', () => {
          socket.emit('ussd_simulator_pong', { message: 'USSD simulator connected' });
        });
      }

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        if (socket.userId) {
          console.log(`User ${socket.userId} disconnected: ${reason}`);
          this.connectedUsers.delete(socket.userId);
        } else {
          console.log(`Public connection disconnected: ${reason}`);
        }
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
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
