const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
  let connection;
  try {
    const userId = req.params.id || req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone,
              u.avatar_url, u.role, u.balance, u.created_at,
              fp.freelancer_id, fp.bio, fp.rating_avg, fp.total_orders, fp.freelancer_level,
              (SELECT COUNT(*) FROM REVIEWS r WHERE r.reviewer_id = u.user_id) as total_reviews_given
       FROM USERS u
       LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
       WHERE u.user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    res.json({ success: true, data: result.rows[0] });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  let connection;
  try {
    const { full_name, phone, avatar_url, location, bio } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    await connection.execute(
      `UPDATE USERS 
       SET full_name = COALESCE(:full_name, full_name),
           phone = COALESCE(:phone, phone),
           avatar_url = COALESCE(:avatar_url, avatar_url)
       WHERE user_id = :userId`,
      { full_name, phone, avatar_url, userId }
    );
    
    // Update freelancer bio if role is freelancer
    const userRole = req.user.role;
    if ((userRole === 'freelancer') && bio) {
      await connection.execute(
        `UPDATE FREELANCER_PROFILES SET bio = :bio WHERE user_id = :userId`,
        { bio, userId }
      );
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Profil berhasil diupdate' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE AVATAR =================
exports.updateAvatar = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    
    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }
    
    connection = await getConnection();
    
    await connection.execute(
      `UPDATE USERS SET avatar_url = :avatarUrl WHERE user_id = :userId`,
      { avatarUrl, userId }
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Avatar berhasil diupdate', data: { avatar_url: avatarUrl } });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE SETTINGS =================
exports.updateSettings = async (req, res) => {
  let connection;
  try {
    const { 
      email_notification, 
      whatsapp_notification, 
      promo_notification,
      two_factor_enabled 
    } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Create or update user settings
    const checkSettings = await connection.execute(
      `SELECT * FROM USER_SETTINGS WHERE user_id = :userId`,
      { userId }
    );
    
    if (checkSettings.rows.length > 0) {
      await connection.execute(
        `UPDATE USER_SETTINGS 
         SET email_notification = NVL(:email_notification, email_notification),
             whatsapp_notification = NVL(:whatsapp_notification, whatsapp_notification),
             promo_notification = NVL(:promo_notification, promo_notification),
             two_factor_enabled = NVL(:two_factor_enabled, two_factor_enabled)
         WHERE user_id = :userId`,
        { email_notification, whatsapp_notification, promo_notification, two_factor_enabled, userId }
      );
    } else {
      await connection.execute(
        `INSERT INTO USER_SETTINGS (user_id, email_notification, whatsapp_notification, promo_notification, two_factor_enabled)
         VALUES (:userId, :email_notification, :whatsapp_notification, :promo_notification, :two_factor_enabled)`,
        { userId, email_notification, whatsapp_notification, promo_notification, two_factor_enabled }
      );
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Pengaturan berhasil diupdate' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET USER STATS =================
exports.getUserStats = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const role = req.user.role;
    
    connection = await getConnection();
    
    let stats = {};
    
    if (role === 'klien' || role === 'client') {
      const orderStats = await connection.execute(
        `SELECT 
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
           COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_orders,
           COUNT(CASE WHEN status = 'waiting_approval' THEN 1 END) as waiting_approval,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
           NVL(SUM(total_price), 0) as total_spent
         FROM ORDERS
         WHERE client_id = :userId`,
        { userId }
      );
      stats = orderStats.rows[0];
    } else if (role === 'freelancer') {
      const freelancerResult = await connection.execute(
        `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
        { userId }
      );
      
      if (freelancerResult.rows.length > 0) {
        const freelancerId = freelancerResult.rows[0].FREELANCER_ID;
        
        const orderStats = await connection.execute(
          `SELECT 
             COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_orders,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
             NVL(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) as total_earned
           FROM ORDERS
           WHERE freelancer_id = :freelancerId`,
          { freelancerId }
        );
        stats = orderStats.rows[0];
      }
    }
    
    res.json({ success: true, data: stats });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET ALL USERS (Admin) =================
exports.getAllUsers = async (req, res) => {
  let connection;
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;
    
    connection = await getConnection();
    
    let sql = `
      SELECT u.user_id, u.username, u.email, u.full_name, u.phone,
             u.avatar_url, u.role, u.balance, u.created_at,
             (SELECT COUNT(*) FROM ORDERS o WHERE o.client_id = u.user_id) as total_orders
      FROM USERS u
      WHERE 1=1
    `;
    const params = {};
    
    if (role) {
      sql += ` AND u.role = :role`;
      params.role = role;
    }
    
    sql += ` ORDER BY u.created_at DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM USERS`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.rows[0].TOTAL
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE USER (Admin) =================
exports.deleteUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    await connection.execute(`DELETE FROM USERS WHERE user_id = :id`, { id });
    await connection.commit();
    
    res.json({ success: true, message: 'User berhasil dihapus' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};
