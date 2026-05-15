const oracledb = require('oracledb');
const db = require('../config/db');

// ✅ WAJIB: Supaya kolom BIO (CLOB) dibaca sebagai string biasa, bukan Stream
oracledb.fetchAsString = [oracledb.CLOB];

/**
 * GET: Ambil Profil Lengkap (Private)
 */
exports.getMyFullProfile = async (req, res) => {
    let connection;
    try {
        const userId = req.user.user_id; // Pastikan middleware auth sudah pasang ini
        connection = await db.getConnection();

        // 1. Ambil Data Dasar User & Freelancer Profile
        const userRes = await connection.execute(
            `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, 
                    u.avatar_url, u.role, u.balance, u.created_at,
                    fp.freelancer_id, fp.bio, fp.rating_avg,
                    fp.total_orders, fp.freelancer_level, fp.joined_at
             FROM USERS u
             LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
             WHERE u.user_id = :id`,
            { id: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const u = userRes.rows[0];
        if (!u) {
            return res.status(404).json({ success: true, message: "User not found" });
        }

        const fid = u.FREELANCER_ID || 0;

        // 2. Ambil Skills
        const skillsRes = await connection.execute(
            `SELECT s.name FROM FREELANCER_SKILLS fs
             JOIN SKILLS s ON fs.skill_id = s.skill_id
             WHERE fs.freelancer_id = :fid`,
            { fid: fid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 3. Ambil Services + Harga Termurah
        const servicesRes = await connection.execute(
            `SELECT s.service_id, s.title, s.thumbnail_url, s.total_orders,
                    (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) as min_price
             FROM SERVICES s
             WHERE s.freelancer_id = :fid AND s.status = 'active'`,
            { fid: fid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 4. Ambil Portofolio
        const portRes = await connection.execute(
            `SELECT portfolio_id, title, description, image_url
             FROM PORTFOLIOS WHERE freelancer_id = :fid`,
            { fid: fid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 🔥 MANUAL MAPPING: Memutus hubungan dengan objek internal Oracle
        // Ini kunci supaya nggak kena "Circular Structure Error"
        const cleanUser = {
            user_id: Number(u.USER_ID),
            username: String(u.USERNAME || ''),
            full_name: String(u.FULL_NAME || ''),
            email: String(u.EMAIL || ''),
            phone: String(u.PHONE || ''),
            avatar_url: String(u.AVATAR_URL || ''),
            role: String(u.ROLE || 'klien'),
            balance: Number(u.BALANCE || 0),
            created_at: u.CREATED_AT,
            // Profil Detail
            bio: String(u.BIO || 'Belum ada bio.'),
            rating_avg: Number(u.RATING_AVG || 0),
            total_orders: Number(u.TOTAL_ORDERS || 0),
            freelancer_level: String(u.FREELANCER_LEVEL || 'New Member'),
            // Data List
            SKILLS: skillsRes.rows.map(s => String(s.NAME)),
            SERVICES: servicesRes.rows.map(s => ({
                SERVICE_ID: Number(s.SERVICE_ID),
                TITLE: String(s.TITLE || ''),
                THUMBNAIL_URL: String(s.THUMBNAIL_URL || ''),
                TOTAL_ORDERS: Number(s.TOTAL_ORDERS || 0),
                PRICE: Number(s.MIN_PRICE || 0)
            })),
            PORTFOLIOS: portRes.rows.map(p => ({
                PORTFOLIO_ID: Number(p.PORTFOLIO_ID),
                TITLE: String(p.TITLE || ''),
                DESCRIPTION: String(p.DESCRIPTION || ''),
                IMAGE_URL: String(p.IMAGE_URL || '')
            }))
        };

        return res.json({
            success: true,
            user: cleanUser
        });

    } catch (err) {
        console.error('Error Profile Me:', err.message);
        // ✅ JANGAN kirim objek 'err' utuh ke .json(), kirim pesannya aja
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: err.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error closing connection:", closeErr);
            }
        }
    }
};
/**
 * PUT: Update Profil
 */
// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  let connection;
  try {
    const { full_name, phone, bio } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    await connection.execute(
      `UPDATE USERS 
       SET full_name = :full_name,
           phone = :phone,
           bio = :bio
       WHERE user_id = :userId`,
      { 
        full_name: full_name || null,
        phone: phone || null,
        bio: bio || null,
        userId 
      }
    );
    
    // Update bio di freelancer_profiles jika user adalah freelancer
    const userRole = await connection.execute(
      `SELECT role FROM USERS WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (userRole.rows[0]?.ROLE === 'freelancer') {
      await connection.execute(
        `UPDATE FREELANCER_PROFILES 
         SET bio = :bio 
         WHERE user_id = :userId`,
        { bio: bio || null, userId }
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Profil berhasil diperbarui'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE PROFILE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPLOAD AVATAR =================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Hanya file gambar yang diperbolehkan'));
  }
});

exports.uploadAvatar = (req, res) => {
  uploadAvatar.single('avatar')(req, res, async (err) => {
    let connection;
    try {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
      }
      
      const userId = req.user.user_id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      connection = await getConnection();
      
      await connection.execute(
        `UPDATE USERS SET avatar_url = :avatarUrl WHERE user_id = :userId`,
        { avatarUrl, userId }
      );
      
      await connection.commit();
      
      res.json({
        success: true,
        message: 'Avatar berhasil diupload',
        data: { avatar_url: avatarUrl }
      });
      
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('UPLOAD AVATAR ERROR:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      if (connection) await connection.close();
    }
  });
};