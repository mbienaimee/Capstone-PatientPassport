import jwt from 'jsonwebtoken';
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scope: string;
}

interface OAuth2User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  hospitalId?: string;
}

export class OAuth2Service {
  private static config: OAuth2Config = {
    clientId: process.env.OAUTH2_CLIENT_ID || '',
    clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
    authorizationUrl: process.env.OAUTH2_AUTHORIZATION_URL || '',
    tokenUrl: process.env.OAUTH2_TOKEN_URL || '',
    userInfoUrl: process.env.OAUTH2_USER_INFO_URL || '',
    redirectUri: process.env.OAUTH2_REDIRECT_URI || '',
    scope: process.env.OAUTH2_SCOPE || 'openid profile email'
  };

  /**
   * Generate OAuth2 authorization URL
   */
  static generateAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      state: state || this.generateState()
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string, state?: string): Promise<any> {
    try {
      const response = await axios.post(this.config.tokenUrl, {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Get user information from OAuth2 provider
   */
  static async getUserInfo(accessToken: string): Promise<OAuth2User> {
    try {
      const response = await axios.get(this.config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userInfo = response.data;
      
      return {
        id: userInfo.sub || userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        roles: userInfo.roles || ['user'],
        hospitalId: userInfo.hospital_id
      };
    } catch (error) {
      logger.error('Error getting user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate JWT token for internal use
   */
  static generateInternalToken(user: OAuth2User): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        hospitalId: user.hospitalId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Verify internal JWT token
   */
  static verifyInternalToken(token: string): any {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
  }
}

/**
 * OAuth2 authentication middleware
 */
export const oauth2Auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'OAuth2 access token required'
      });
      return;
    }

    const accessToken = authHeader.substring(7);
    
    // Verify token with OAuth2 provider
    const userInfo = await OAuth2Service.getUserInfo(accessToken);
    
    // Generate internal JWT token
    const internalToken = OAuth2Service.generateInternalToken(userInfo);
    
    // Add user info to request
    req.user = {
      ...userInfo,
      internalToken
    };

    next();
  } catch (error) {
    logger.error('OAuth2 authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired OAuth2 token'
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Hospital-specific authorization middleware
 */
export const requireHospitalAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const userHospitalId = req.user.hospitalId;
  const requestedHospitalId = req.params.hospitalId || req.body.hospitalId;

  if (!userHospitalId) {
    res.status(403).json({
      success: false,
      message: 'Hospital access required'
    });
    return;
  }

  if (requestedHospitalId && userHospitalId !== requestedHospitalId) {
    res.status(403).json({
      success: false,
      message: 'Access denied to this hospital'
    });
    return;
  }

  next();
};

/**
 * API key authentication middleware
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    res.status(401).json({
      success: false,
      message: 'API key required'
    });
    return;
  }

  // Validate API key (this would check against database)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
    return;
  }

  // Add API key info to request
  req.apiKey = apiKey;
  next();
};

