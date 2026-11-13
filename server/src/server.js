const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const connectDB = require('./config/db');
const seedTemplates = require('./utils/seedTemplates');
const errorHandler = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const templateRoutes = require('./routes/templateRoutes');
const posterRoutes = require('./routes/posterRoutes');
const adminRoutes = require('./routes/adminRoutes');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Run seeder
  await seedTemplates();

  const app = express();

  // Body parser
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS config
  app.use(
    cors({
      origin: config.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Poster App API is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/posters', posterRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  const PORT = config.PORT || 5000;
  app.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`
    );
  });
};

startServer().catch((err) => {
  console.error('❌ Server startup failure:', err.message);
  process.exit(1);
});
