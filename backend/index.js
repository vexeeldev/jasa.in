const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== ROUTES ==========
// Health check / test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'jasa.in API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      services: '/api/services',
      orders: '/api/orders'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Contoh route tambahan (nanti bisa ditambah)
// app.use('/api/users', userRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/orders', orderRoutes);

// ========== ERROR HANDLING ==========
// 404 handler - untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token sudah kadaluarsa'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========== START SERVER ==========
// Inisialisasi database pool dan mulai server
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Auth API: http://localhost:${PORT}/api/auth`);
    });
  })
  .catch(err => {
    console.error('❌ Gagal memulai server karena error koneksi DB:', err);
    process.exit(1);
  });

// ========== GRACEFUL SHUTDOWN ==========
// Handle penutupan server dengan baik
process.on('SIGINT', async () => {
  console.log('\n🛑 Server dimatikan, menutup koneksi pool Oracle...');
  try {
    await db.closePool();
    console.log('✅ Koneksi database ditutup');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error menutup koneksi database:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, closing server...');
  try {
    await db.closePool();
    console.log('✅ Koneksi database ditutup');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error menutup koneksi database:', err);
    process.exit(1);
  }
});