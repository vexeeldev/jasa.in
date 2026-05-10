const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { getConnection } = db;
const path = require('path');
const oracledb = require('oracledb');

// Import main router
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

app.use((req, res, next) => {
  req.headers['ngrok-skip-browser-warning'] = 'any-value';
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/client/pay/:token', async (req, res) => {
  const { token } = req.params;
  let connection;
  
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT status FROM ORDERS WHERE payment_token = :token`,
      { token },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).send(`
        <html><body>
          <h1>Token tidak valid</h1>
          <p>Token: ${token}</p>
          <a href="/client/orders">Lihat Pesanan Saya</a>
        </body></html>
      `);
    }
    
    const status = result.rows[0].STATUS;
    
    // Jika sudah bukan waiting_payment, redirect
    if (status !== 'waiting_payment') {
      return res.redirect('/client/orders');
    }
    
    // Kirim file HTML
    const htmlPath = path.join(__dirname, 'views', 'payment.html');
    console.log('📄 Serving HTML from:', htmlPath);
    res.sendFile(htmlPath);
    
  } catch (err) {
    console.error('Payment page error:', err);
    res.status(500).send(`
      <html><body>
        <h1>Error</h1>
        <p>${err.message}</p>
      </body></html>
    `);
  } finally {
    if (connection) await connection.close();
  }
});


app.post('/api/payments/payment-confirm/:token', (req, res) => {
  // panggil langsung controller
  const paymentController = require('./controllers/paymentController');
  paymentController.confirmPayment(req, res);
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