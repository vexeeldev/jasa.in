const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Import main router
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// ROUTES
// =====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'jasa.in API is running 🚀',
    version: '1.0.0'
  });
});

// Gunakan routes/index.js untuk semua API
app.use('/api', apiRoutes);

// =====================
// 404 HANDLER
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// =====================
// GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Token tidak valid' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Token expired, silakan login ulang' 
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// =====================
// START SERVER
// =====================
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🚀 jasa.in API Server Running                 ║
║                                                  ║
║   📡 Port: http://localhost:${PORT}              ║
║   📚 API: http://localhost:${PORT}/api           ║
║                                                  ║
║   ✅ Database connected                         ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║   📋 Available Endpoints:                       ║
║   ───────────────────────────────────────────── ║
║   POST   /api/auth/login                        ║
║   POST   /api/auth/register                     ║
║   GET    /api/users/me                          ║
║   GET    /api/services                          ║
║   GET    /api/categories                        ║
║   GET    /api/orders                            ║
║   GET    /api/payments/balance                  ║
║   GET    /api/messages/chats                    ║
║   GET    /api/notifications                     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  });

// =====================
// GRACEFUL SHUTDOWN
// =====================
const shutdown = async () => {
  console.log('\n🛑 Shutting down...');
  await db.closePool();
  console.log('✅ Database pool closed');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;