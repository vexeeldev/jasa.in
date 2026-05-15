const express = require('express');
const cors = require('cors');
const http = require('http'); // 🔥 TAMBAHKAN
const socketIo = require('socket.io'); // 🔥 TAMBAHKAN
const db = require('./config/db');
const { getConnection } = db;
const path = require('path');
const oracledb = require('oracledb');

// Import main router
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 BUAT HTTP SERVER
const server = http.createServer(app);

// 🔥 INIT SOCKET.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Sesuaikan dengan port frontend Anda
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 🔥 SIMPAN SOCKET PER USER
const userSockets = new Map();

// 🔥 SOCKET.IO CONNECTION HANDLER
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Register user ID
  socket.on('register', (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`✅ User ${userId} registered with socket ${socket.id}`);
      console.log(`📊 Active users: ${userSockets.size}`);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
        break;
      }
    }
    console.log(`📊 Active users: ${userSockets.size}`);
  });
});

// 🔥 FUNGSI GLOBAL UNTUK MENGIRIM NOTIFIKASI REALTIME
global.sendNotificationToUser = (userId, notification) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit('new_notification', notification);
    console.log(`📨 Notification sent to user ${userId}: ${notification.title}`);
    return true;
  }
  console.log(`⚠️ User ${userId} not connected, notification saved to DB only`);
  return false;
};

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

require('./scheduler');

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
    
    if (status !== 'waiting_payment') {
      return res.redirect('/client/orders');
    }
    
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
  const paymentController = require('./controllers/paymentController');
  paymentController.confirmPayment(req, res);
});

// =====================
// 🔥 ROUTE UPLOAD KHUSUS - TANPA BODY PARSER
// =====================
const multer = require('multer');
const fs = require('fs');

const servicesUploadDir = 'uploads/services';
if (!fs.existsSync(servicesUploadDir)) {
  fs.mkdirSync(servicesUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/services/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan'));
    }
  }
});

app.post('/api/services/upload-thumbnail', (req, res, next) => {
  next();
}, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file' });
    }
    
    console.log('✅ File uploaded:', req.file.filename);
    
    res.json({
      success: true,
      data: { url: `/uploads/services/${req.file.filename}` }
    });
  });
});

// =====================
// BODY PARSER UNTUK ROUTE LAIN
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// API ROUTES LAINNYA
// =====================
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
    // 🔥 GUNAKAN server.listen BUKAN app.listen
    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🚀 jasa.in API Server Running                 ║
║                                                  ║
║   📡 Port: http://localhost:${PORT}              ║
║   📚 API: http://localhost:${PORT}/api           ║
║   🔌 WebSocket: ws://localhost:${PORT}           ║
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
║   POST   /api/services/upload-thumbnail         ║
║   GET    /api/categories                        ║
║   GET    /api/orders                            ║
║   GET    /api/payments/balance                  ║
║   GET    /api/messages/chats                    ║
║   GET    /api/notifications                     ║
║   🔌 WebSocket realtime notifications           ║
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
  
  // Tutup semua koneksi socket
  io.close(() => {
    console.log('✅ Socket.io closed');
  });
  
  await db.closePool();
  console.log('✅ Database pool closed');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;