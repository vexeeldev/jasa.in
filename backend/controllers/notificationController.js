const { getConnection } = require('../config/db');

// ================= GET ALL NOTIFICATIONS BY USER =================
exports.getNotifications = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20, type, is_read } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT n.notif_id, n.user_id, n.type, n.title, n.body, 
             n.is_read, n.created_at
      FROM NOTIFICATIONS n
      WHERE n.user_id = :userId
    `;
    
    const params = { userId };
    
    if (type) {
      sql += ` AND n.type = :type`;
      params.type = type;
    }
    
    if (is_read === '0' || is_read === '1') {
      sql += ` AND n.is_read = :is_read`;
      params.is_read = is_read;
    }
    
    sql += ` ORDER BY n.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Get total count
    let countSql = `
      SELECT COUNT(*) as total 
      FROM NOTIFICATIONS 
      WHERE user_id = :userId
    `;
    const countParams = { userId };
    
    if (type) {
      countSql += ` AND type = :type`;
      countParams.type = type;
    }
    
    if (is_read === '0' || is_read === '1') {
      countSql += ` AND is_read = :is_read`;
      countParams.is_read = is_read;
    }
    
    const countResult = await connection.execute(countSql, countParams);
    const total = countResult.rows[0]?.TOTAL || 0;
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('GET NOTIFICATIONS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET UNREAD COUNT =================
exports.getUnreadCount = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT COUNT(*) as unread_count
       FROM NOTIFICATIONS
       WHERE user_id = :userId AND is_read = '0'`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: {
        unread_count: result.rows[0]?.UNREAD_COUNT || 0
      }
    });
    
  } catch (err) {
    console.error('GET UNREAD COUNT ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= MARK NOTIFICATION AS READ =================
exports.markAsRead = async (req, res) => {
  let connection;
  try {
    const { notifId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `UPDATE NOTIFICATIONS 
       SET is_read = '1' 
       WHERE notif_id = :notifId AND user_id = :userId AND is_read = '0'`,
      { notifId, userId }
    );
    
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notifikasi tidak ditemukan atau sudah dibaca' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notifikasi ditandai sebagai sudah dibaca'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('MARK AS READ ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= MARK ALL NOTIFICATIONS AS READ =================
exports.markAllAsRead = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `UPDATE NOTIFICATIONS 
       SET is_read = '1' 
       WHERE user_id = :userId AND is_read = '0'`,
      { userId }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Semua notifikasi ditandai sebagai sudah dibaca',
      data: {
        updated_count: result.rowsAffected
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('MARK ALL AS READ ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE NOTIFICATION =================
exports.deleteNotification = async (req, res) => {
  let connection;
  try {
    const { notifId } = req.params;
    const userId = req.user.user_id;
    const role = req.user.role;
    
    connection = await getConnection();
    
    let sql = `DELETE FROM NOTIFICATIONS WHERE notif_id = :notifId`;
    const params = { notifId };
    
    if (role !== 'admin') {
      sql += ` AND user_id = :userId`;
      params.userId = userId;
    }
    
    const result = await connection.execute(sql, params);
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notifikasi tidak ditemukan' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notifikasi berhasil dihapus'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELETE NOTIFICATION ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE ALL NOTIFICATIONS =================
exports.deleteAllNotifications = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `DELETE FROM NOTIFICATIONS WHERE user_id = :userId`,
      { userId }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Semua notifikasi berhasil dihapus',
      data: {
        deleted_count: result.rowsAffected
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELETE ALL NOTIFICATIONS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET NOTIFICATION BY ID =================
exports.getNotificationById = async (req, res) => {
  let connection;
  try {
    const { notifId } = req.params;
    const userId = req.user.user_id;
    const role = req.user.role;
    
    connection = await getConnection();
    
    let sql = `SELECT n.* FROM NOTIFICATIONS n WHERE n.notif_id = :notifId`;
    const params = { notifId };
    
    if (role !== 'admin') {
      sql += ` AND n.user_id = :userId`;
      params.userId = userId;
    }
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notifikasi tidak ditemukan' 
      });
    }
    
    // Auto mark as read when viewed
    if (result.rows[0].IS_READ === '0') {
      await connection.execute(
        `UPDATE NOTIFICATIONS SET is_read = '1' WHERE notif_id = :notifId`,
        { notifId }
      );
      await connection.commit();
      result.rows[0].IS_READ = '1';
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('GET NOTIFICATION BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE NOTIFICATION (Internal use) =================
// Fungsi ini dipanggil oleh controller lain untuk membuat notifikasi
exports.createNotification = async (userId, type, title, body) => {
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `INSERT INTO NOTIFICATIONS (user_id, type, title, body, is_read)
       VALUES (:userId, :type, :title, :body, '0')
       RETURNING notif_id INTO :notif_id`,
      {
        userId,
        type,
        title,
        body,
        notif_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    await connection.commit();
    
    return {
      success: true,
      notif_id: result.outBinds.notif_id[0]
    };
    
  } catch (err) {
    console.error('CREATE NOTIFICATION ERROR:', err);
    return { success: false, error: err.message };
  } finally {
    if (connection) await connection.close();
  }
};