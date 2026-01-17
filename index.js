require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { redisClient } = require('./config/redis');

const numCPUs = process.env.WORKERS || os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart dead worker
    cluster.fork();
  });
} else {
  const app = express();

  // Connect to MongoDB
  connectDB();

  // Connect to Redis
  redisClient.connect().catch(err => {
    console.error('Redis connection failed, continuing without cache:', err.message);
  });

  // Middleware
  app.use(compression()); // Compress responses
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Limit auth attempts
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later.'
  });

  app.use('/api/', limiter);
  app.use('/api/auth/', authLimiter);

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/courses', require('./routes/courses'));
  app.use('/api/enrollments', require('./routes/enrollments'));
  app.use('/api/batches', require('./routes/batches'));
  app.use('/api/subjects', require('./routes/subjects'));
  app.use('/api/videos', require('./routes/videos'));
  app.use('/api/transactions', require('./routes/transactions'));
  app.use('/api/enquiries', require('./routes/enquiries'));

  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'VideoApp LMS Backend API',
      version: '1.0.0',
      status: 'running',
      worker: process.pid,
      endpoints: {
        health: '/api/health',
        metrics: '/api/metrics',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          me: 'GET /api/auth/me'
        },
        courses: {
          list: 'GET /api/courses?page=1&limit=20',
          get: 'GET /api/courses/:id',
          create: 'POST /api/courses',
          update: 'PUT /api/courses/:id',
          publish: 'PUT /api/courses/:id/publish'
        },
        batches: {
          list: 'GET /api/batches?page=1&limit=20',
          byCoarse: 'GET /api/batches/course/:courseId',
          get: 'GET /api/batches/:id',
          create: 'POST /api/batches',
          update: 'PUT /api/batches/:id'
        },
        videos: 'GET /api/videos?courseId=&status=1&page=1&limit=20',
        enrollments: 'POST /api/enrollments/:courseId/enroll',
        transactions: 'POST /api/transactions',
        enquiries: 'POST /api/enquiries'
      }
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      message: 'Server is running', 
      status: 'ok',
      worker: process.pid,
      timestamp: new Date().toISOString()
    });
  });

  // Metrics endpoint
  app.get('/api/metrics', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    res.json({
      pid: process.pid,
      uptime,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      }
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ 
      message: 'Something went wrong', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
