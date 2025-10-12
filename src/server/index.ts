import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init';
import authRoutes from './routes/auth';
import followUpRoutes from './routes/followups';
import templateRoutes from './routes/templates';
import userRoutes from './routes/users';
import { authenticateToken } from './middleware/auth';
import paystack from 'paystack'; 
import paymentsRouter from './routes/payment';

dotenv.config({ path: './.env' });

// Check if Paystack key is loaded
console.log('Paystack key loaded:', process.env.PAYSTACK_SECRET_KEY ? 'Yes' : 'No');




const app = express();
const paystackClient = paystack('sk_test_049b178b150b1f929d3324122c53dbe6a1467d4f');
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/followups', authenticateToken, followUpRoutes);
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/paystack', paymentsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('🗄️ Database tables initialized');
    
    app.listen(PORT, () => {
      console.log(`🚀 FollowUpMate server running on port ${PORT}`);
      console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Connected to SQLite database`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();