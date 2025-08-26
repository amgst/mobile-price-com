import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import type { Express } from "express";

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123"
};

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
    username?: string;
  }
}

export function setupAuthMiddleware(app: Express) {
  // Get environment variables
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET || 'mobile-admin-secret-key-dev';
  
  // Setup session middleware
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // Use secure cookies in production (HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Use lax for better compatibility with Netlify
    }
  }));
}

// Authentication check middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // For API routes, return JSON error
  if (req.path.startsWith('/api/admin')) {
    return res.status(401).json({ 
      message: 'Authentication required',
      redirectTo: '/admin/login'
    });
  }
  
  // For page routes, redirect to login
  return res.redirect('/admin/login');
}

// Login route handler
export function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    
    res.json({ 
      success: true,
      message: 'Login successful',
      redirectTo: '/admin'
    });
  } else {
    res.status(401).json({ 
      success: false,
      message: 'Invalid username or password'
    });
  }
}

// Logout route handler
export function handleLogout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
}

// Check auth status
export function checkAuthStatus(req: Request, res: Response) {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    username: req.session.username || null
  });
}