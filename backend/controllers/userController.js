const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');
const oracledb = require('oracledb');

// ================= HELPER: Safe JSON response =================
const safeJson = (res, data, status = 200) => {
  try {
    // Test stringify dulu
    const testString = JSON.stringify(data);
    res.status(status).json(data);
  } catch (err) {
    console.error('JSON.stringify error:', err.message);
    // Jika gagal, kirim response sederhana
    res.status(status).json({ 
      success: false, 
      message: 'Data cannot be serialized',
      error: err.message 
    });
  }
};

// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
  let connection;
  try {
    const userId = req.params.id || req.user?.user_id;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID tidak ditemukan' });
    }
    
    connection = await getConnection();
    
    // Query user
    const userResult = await connection.execute(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone,
              u.avatar_url, u.role, u.balance, u.created_at
       FROM USERS u
       WHERE u.user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    const userRow = userResult.rows[0];
    
    // Buat object plain
    const userData = {
      user_id: Number(userRow.USER_ID),
      username: String(userRow.USERNAME || ''),
      email: String(userRow.EMAIL || ''),
      full_name: String(userRow.FULL_NAME || ''),
      phone: String(userRow.PHONE || ''),
      avatar_url: String(userRow.AVATAR_URL || ''),
      role: String(userRow.ROLE || 'klien'),
      balance: Number(userRow.BALANCE || 0),
      created_at: userRow.CREATED_AT ? String(userRow.CREATED_AT) : null,
      freelancer: null
    };
    
    // Jika freelancer, ambil data freelancer profile
    if (userData.role === 'freelancer') {
      const fpResult = await connection.execute(
        `SELECT freelancer_id, bio, rating_avg, total_orders, freelancer_level
         FROM FREELANCER_PROFILES
         WHERE user_id = :userId`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (fpResult.rows.length > 0) {
        const fp = fpResult.rows[0];
        
        // 🔥 Handle CLOB dengan benar
        let bioString = '';
        if (fp.BIO) {
          if (typeof fp.BIO === 'string') {
            bioString = fp.BIO;
          } else if (fp.BIO && typeof fp.BIO.getData === 'function') {
            bioString = fp.BIO.getData();
          } else if (fp.BIO.VALUE) {
            bioString = String(fp.BIO.VALUE);
          } else {
            bioString = String(fp.BIO);
          }
        }
        
        userData.freelancer = {
          freelancer_id: Number(fp.FREELANCER_ID),
          bio: bioString,
          rating_avg: Number(fp.RATING_AVG || 0),
          total_orders: Number(fp.TOTAL_ORDERS || 0),
          freelancer_level: String(fp.FREELANCER_LEVEL || 'new')
        };
      }
    }
    
    // Hitung total reviews given
    const reviewResult = await connection.execute(
      `SELECT COUNT(*) as total FROM REVIEWS WHERE reviewer_id = :userId`,
      { userId }
    );
    userData.total_reviews_given = Number(reviewResult.rows[0]?.TOTAL || 0);
    
    res.json({ success: true, data: userData });
    
  } catch (err) {
    console.error('GET PROFILE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

exports.updateProfile = async (req, res) => {
  let connection;
  try {
    const { full_name, phone, avatar_url, bio } = req.body;
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    connection = await getConnection();
    
    // 🔥 CEK: Ambil data user untuk cek role
    const userCheck = await connection.execute(
      `SELECT role FROM USERS WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    const userRole = userCheck.rows[0].ROLE;
    
    // Update USERS table
    const updateFields = [];
    const updateParams = {};
    
    if (full_name !== undefined) {
      updateFields.push(`full_name = :full_name`);
      updateParams.full_name = full_name;
    }
    if (phone !== undefined) {
      updateFields.push(`phone = :phone`);
      updateParams.phone = phone;
    }
    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = :avatar_url`);
      updateParams.avatar_url = avatar_url;
    }
    
    if (updateFields.length > 0) {
      const updateUserQuery = `UPDATE USERS SET ${updateFields.join(', ')} WHERE user_id = :userId`;
      updateParams.userId = userId;
      const userUpdateResult = await connection.execute(updateUserQuery, updateParams);
      console.log('User updated:', userUpdateResult.rowsAffected, 'rows');
    }
    
    // 🔥 UPDATE BIO untuk FREELANCER
    if (bio !== undefined) {
      if (userRole !== 'freelancer') {
        return res.status(400).json({ 
          success: false, 
          message: 'Hanya freelancer yang bisa mengupdate bio' 
        });
      }
      
      // Cek apakah ada record di FREELANCER_PROFILES
      const freelancerCheck = await connection.execute(
        `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
        { userId }
      );
      
      if (freelancerCheck.rows.length === 0) {
        // 🔥 Jika belum ada, buat dulu record freelancer profile
        console.log('Freelancer profile not found, creating...');
        await connection.execute(
          `INSERT INTO FREELANCER_PROFILES (user_id, bio) VALUES (:userId, :bio)`,
          { userId, bio: bio || null }
        );
      } else {
        // Update existing bio
        await connection.execute(
          `UPDATE FREELANCER_PROFILES SET bio = :bio WHERE user_id = :userId`,
          { bio: bio || null, userId }
        );
      }
      console.log('Bio updated for user:', userId);
    }
    
    await connection.commit();
    
    // Ambil data user yang sudah diupdate
    const updatedUser = await connection.execute(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone,
              u.avatar_url, u.role, u.balance, u.created_at,
              fp.freelancer_id, TO_CHAR(fp.bio) as bio, fp.rating_avg, 
              fp.total_orders, fp.freelancer_level
       FROM USERS u
       LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
       WHERE u.user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    let userData = null;
    if (updatedUser.rows.length > 0) {
      const row = updatedUser.rows[0];
      userData = {
        user_id: Number(row.USER_ID),
        username: String(row.USERNAME || ''),
        email: String(row.EMAIL || ''),
        full_name: String(row.FULL_NAME || ''),
        phone: String(row.PHONE || ''),
        avatar_url: String(row.AVATAR_URL || ''),
        role: String(row.ROLE || 'klien'),
        balance: Number(row.BALANCE || 0),
        created_at: String(row.CREATED_AT || ''),
        freelancer_id: row.FREELANCER_ID ? Number(row.FREELANCER_ID) : null,
        bio: row.BIO ? String(row.BIO) : '',
        rating_avg: Number(row.RATING_AVG || 0),
        total_orders: Number(row.TOTAL_ORDERS || 0),
        freelancer_level: String(row.FREELANCER_LEVEL || 'new')
      };
    }
    
    res.json({ 
      success: true, 
      message: 'Profil berhasil diupdate',
      data: userData 
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE PROFILE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE AVATAR =================
exports.updateAvatar = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
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
    console.error('UPDATE AVATAR ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE SETTINGS (Change Password) =================
exports.updateSettings = async (req, res) => {
  let connection;
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Password wajib diisi' });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }
    
    connection = await getConnection();
    
    const userResult = await connection.execute(
      `SELECT password_hash FROM USERS WHERE user_id = :userId`,
      { userId }
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    
    const isValid = await bcrypt.compare(current_password, userResult.rows[0].PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password saat ini salah' });
    }
    
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await connection.execute(
      `UPDATE USERS SET password_hash = :hashedPassword WHERE user_id = :userId`,
      { hashedPassword, userId }
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Password berhasil diubah' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE SETTINGS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET USER STATS =================
exports.getUserStats = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.user_id;
    const role = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    connection = await getConnection();
    
    let stats = {};
    
    if (role === 'klien') {
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
      
      if (orderStats.rows.length > 0) {
        stats = {
          pending_orders: Number(orderStats.rows[0].PENDING_ORDERS || 0),
          active_orders: Number(orderStats.rows[0].ACTIVE_ORDERS || 0),
          waiting_approval: Number(orderStats.rows[0].WAITING_APPROVAL || 0),
          completed_orders: Number(orderStats.rows[0].COMPLETED_ORDERS || 0),
          total_spent: Number(orderStats.rows[0].TOTAL_SPENT || 0)
        };
      }
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
        
        if (orderStats.rows.length > 0) {
          stats = {
            active_orders: Number(orderStats.rows[0].ACTIVE_ORDERS || 0),
            completed_orders: Number(orderStats.rows[0].COMPLETED_ORDERS || 0),
            total_earned: Number(orderStats.rows[0].TOTAL_EARNED || 0)
          };
        }
      }
    }
    
    res.json({ success: true, data: stats });
    
  } catch (err) {
    console.error('GET USER STATS ERROR:', err);
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
    
    // Konversi ke array of plain objects
    const users = result.rows.map(row => ({
      user_id: Number(row.USER_ID),
      username: String(row.USERNAME || ''),
      email: String(row.EMAIL || ''),
      full_name: String(row.FULL_NAME || ''),
      phone: String(row.PHONE || ''),
      avatar_url: String(row.AVATAR_URL || ''),
      role: String(row.ROLE || ''),
      balance: Number(row.BALANCE || 0),
      created_at: row.CREATED_AT ? String(row.CREATED_AT) : null,
      total_orders: Number(row.TOTAL_ORDERS || 0)
    }));
    
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM USERS`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: Number(countResult.rows[0]?.TOTAL || 0)
      }
    });
    
  } catch (err) {
    console.error('GET ALL USERS ERROR:', err);
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
    console.error('DELETE USER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};