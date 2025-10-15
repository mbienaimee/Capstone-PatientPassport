# Patient Passport Frontend

A modern, responsive React application built with TypeScript and Tailwind CSS for the Patient Passport healthcare management system.

## Overview

The Patient Passport Frontend provides an intuitive, accessible user interface for patients, doctors, hospitals, and administrators to manage medical records, appointments, and healthcare workflows. Built with modern web technologies and optimized for performance and user experience.

## Features

### User Interfaces
- **Patient Dashboard**: Personal medical record management
- **Doctor Dashboard**: Patient list and medical record access
- **Hospital Dashboard**: Administrative controls and analytics
- **Admin Dashboard**: System-wide management and monitoring

### Core Functionality
- **Authentication**: Secure login with OTP verification
- **Real-time Updates**: Live notifications and status updates
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Access Control**: Role-based interface customization
- **Medical Records**: Secure viewing and management
- **Search & Filter**: Advanced patient and record search
- **Notifications**: Real-time notification system

### User Experience
- **Modern UI**: Clean, professional design with green healthcare theme
- **Accessibility**: WCAG compliant with keyboard navigation
- **Performance**: Optimized loading and smooth animations
- **Mobile-First**: Responsive design for all devices
- **Dark Mode**: Optional dark theme support
- **Internationalization**: Multi-language support ready

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form
- **Validation**: Zod
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── access-control/  # Access control components
│   │   ├── notifications/   # Notification components
│   │   └── ...              # Feature-specific components
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── services/             # API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   └── ...
│   ├── types/               # TypeScript definitions
│   ├── assets/              # Static assets
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Public assets
├── package.json             # Dependencies
└── vite.config.ts           # Vite configuration
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env.local
   ```
   
   Configure your `.env.local` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_APP_NAME=Patient Passport
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Component Architecture

### UI Components
Located in `src/components/ui/`:
- **Button**: Customizable button component
- **Card**: Container component for content
- **Badge**: Status and label components
- **LoadingSpinner**: Loading state indicator
- **Notification**: Toast notification component

### Feature Components
- **PatientPassport**: Main patient interface
- **DoctorDashboard**: Doctor's patient management
- **HospitalDashboard**: Hospital administration
- **AdminDashboard**: System administration
- **OTPVerification**: Two-factor authentication
- **AccessControl**: Permission management

### Context Providers
- **AuthContext**: Authentication state management
- **NotificationContext**: Global notification system

## Styling & Theme

### Design System
- **Primary Color**: Green (#22c55e) - Healthcare theme
- **Typography**: Inter font family
- **Spacing**: Consistent spacing scale
- **Shadows**: Subtle elevation system
- **Animations**: Smooth transitions and micro-interactions

### Tailwind Configuration
```javascript
// Custom green color palette
colors: {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  }
}
```

### CSS Classes
- **Form Styles**: `.form-input`, `.form-label`, `.form-group`
- **Button Styles**: `.btn-primary`, `.btn-secondary`, `.btn-outline`
- **Dashboard Styles**: `.dashboard-container`, `.dashboard-card`
- **Status Badges**: `.badge-success`, `.badge-warning`, `.badge-danger`

## State Management

### Authentication State
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### Notification State
```typescript
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}
```

## API Integration

### Service Layer
```typescript
// API service with Axios
class ApiService {
  private baseURL: string;
  
  async get<T>(endpoint: string): Promise<T> {
    // GET request implementation
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    // POST request implementation
  }
}
```

### Real-time Communication
```typescript
// Socket.io integration
class SocketService {
  private socket: Socket;
  
  connect(): void {
    this.socket = io(import.meta.env.VITE_SOCKET_URL);
  }
  
  onNotification(callback: (notification: Notification) => void): void {
    this.socket.on('notification', callback);
  }
}
```

## User Roles & Interfaces

### Patient Interface
- **Dashboard**: Personal medical records overview
- **Profile Management**: Update personal information
- **Access Requests**: Grant/revoke doctor access
- **Notifications**: Real-time updates

### Doctor Interface
- **Patient List**: View assigned patients
- **Medical Records**: Access patient information
- **Access Requests**: Request patient access
- **Notifications**: System updates

### Hospital Interface
- **Doctor Management**: Add/edit doctor profiles
- **Patient Registration**: Onboard new patients
- **Analytics**: Hospital performance metrics
- **Settings**: Hospital configuration

### Admin Interface
- **User Management**: System-wide user control
- **System Settings**: Global configuration
- **Audit Logs**: Activity monitoring
- **Analytics**: System-wide metrics

## Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Performance Optimization

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy components

### Bundle Optimization
- Tree shaking for unused code
- Asset optimization
- Compression for production builds

### Caching Strategy
- Service worker for offline support
- Local storage for user preferences
- Memory caching for API responses

## Accessibility Features

### WCAG Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Management**: Clear focus indicators

### Implementation
```typescript
// Accessible button component
<button
  className="btn-primary focus-ring"
  aria-label="Submit form"
  onClick={handleSubmit}
>
  Submit
</button>
```

## Testing Strategy

### Unit Tests
```typescript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Tests
- API service testing
- Context provider testing
- Form validation testing

### E2E Tests
- User workflow testing
- Cross-browser compatibility
- Mobile responsiveness

## Deployment

### Production Build
```bash
npm run build
```

### Static Hosting
- **Vercel**: Zero-config deployment
- **Netlify**: Git-based deployment
- **AWS S3**: Static website hosting

### Environment Configuration
```env
# Production environment variables
VITE_API_URL=https://api.patientpassport.com/api
VITE_SOCKET_URL=https://api.patientpassport.com
VITE_APP_NAME=Patient Passport
VITE_APP_VERSION=1.0.0
```

## Browser Support

### Supported Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Support
- iOS Safari (latest)
- Chrome Mobile (latest)
- Samsung Internet (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new components
5. Ensure accessibility compliance
6. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Patient Passport Frontend** - Modern, accessible healthcare user interface.