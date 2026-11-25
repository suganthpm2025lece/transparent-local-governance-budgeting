const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const voteRoutes = require('./routes/voteRoutes');
const projectRoutes = require('./routes/projectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (allowing uploaded images/docs to render cross-origin in dev/prod)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow Vercel preview deployments if configured
      if (origin.endsWith('.vercel.app') && process.env.ALLOW_VERCEL_PREVIEWS === 'true') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded proposal supporting documents/images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (used by Render & monitoring)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Transparent Local Governance & Budgeting API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
