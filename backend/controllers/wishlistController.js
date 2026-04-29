const { getConnection } = require('../config/db');
const oracledb = require('oracledb');
// ================= GET MY WISHLIST =================
exports.getMyWishlist = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;
    
    connection = await getConnection();
    
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT w.wishlist_id, w.user_id, w.service_id, w.created_at,
              s.title, s.description, s.thumbnail_url, s.total_orders,
              (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) as min_price,
              u.full_name as freelancer_name, u.username, u.avatar_url,
              fp.rating_avg as freelancer_rating
       FROM WISHLIST w
       JOIN SERVICES s ON w.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE w.user_id = :userId
       ORDER BY w.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { userId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM WISHLIST WHERE user_id = :userId`,
      { userId }
    );
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
    console.error('GET MY WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= ADD TO WISHLIST =================
exports.addToWishlist = async (req, res) => {
  let connection;
  try {
    const { service_id } = req.body;
    const userId = req.user.user_id;
    
    if (!service_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service ID wajib diisi' 
      });
    }
    
    connection = await getConnection();
    
    // Check if service exists
    const serviceCheck = await connection.execute(
      `SELECT service_id FROM SERVICES WHERE service_id = :service_id AND status = 'active'`,
      { service_id }
    );
    
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Layanan tidak ditemukan' 
      });
    }
    
    // Check if already in wishlist
    const existingCheck = await connection.execute(
      `SELECT wishlist_id FROM WISHLIST 
       WHERE user_id = :userId AND service_id = :service_id`,
      { userId, service_id }
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Layanan sudah ada di wishlist' 
      });
    }
    
    const result = await connection.execute(
      `INSERT INTO WISHLIST (user_id, service_id)
       VALUES (:userId, :service_id)
       RETURNING wishlist_id INTO :wishlist_id`,
      {
        userId,
        service_id,
        wishlist_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const wishlistId = result.outBinds.wishlist_id[0];
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Layanan berhasil ditambahkan ke wishlist',
      data: { wishlist_id: wishlistId }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('ADD TO WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= REMOVE FROM WISHLIST =================
exports.removeFromWishlist = async (req, res) => {
  let connection;
  try {
    const { wishlistId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `DELETE FROM WISHLIST 
       WHERE wishlist_id = :wishlistId AND user_id = :userId`,
      { wishlistId, userId }
    );
    
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Layanan tidak ditemukan di wishlist' 
      });
    }
    
    res.json({
      success: true,
      message: 'Layanan berhasil dihapus dari wishlist'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('REMOVE FROM WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= REMOVE SERVICE FROM WISHLIST BY SERVICE ID =================
exports.removeServiceFromWishlist = async (req, res) => {
  let connection;
  try {
    const { serviceId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `DELETE FROM WISHLIST 
       WHERE service_id = :serviceId AND user_id = :userId`,
      { serviceId, userId }
    );
    
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Layanan tidak ditemukan di wishlist' 
      });
    }
    
    res.json({
      success: true,
      message: 'Layanan berhasil dihapus dari wishlist'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('REMOVE SERVICE FROM WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CHECK IF SERVICE IN WISHLIST =================
exports.isInWishlist = async (req, res) => {
  let connection;
  try {
    const { serviceId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT wishlist_id FROM WISHLIST 
       WHERE user_id = :userId AND service_id = :serviceId`,
      { userId, serviceId }
    );
    
    res.json({
      success: true,
      data: {
        is_in_wishlist: result.rows.length > 0,
        wishlist_id: result.rows[0]?.WISHLIST_ID || null
      }
    });
    
  } catch (err) {
    console.error('CHECK IN WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CLEAR ALL WISHLIST =================
exports.clearWishlist = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `DELETE FROM WISHLIST WHERE user_id = :userId`,
      { userId }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Semua wishlist berhasil dikosongkan',
      data: {
        deleted_count: result.rowsAffected
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CLEAR WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET WISHLIST COUNT =================
exports.getWishlistCount = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT COUNT(*) as total FROM WISHLIST WHERE user_id = :userId`,
      { userId }
    );
    
    res.json({
      success: true,
      data: {
        total: result.rows[0]?.TOTAL || 0
      }
    });
    
  } catch (err) {
    console.error('GET WISHLIST COUNT ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= BULK ADD TO WISHLIST =================
exports.bulkAddToWishlist = async (req, res) => {
  let connection;
  try {
    const { service_ids } = req.body;
    const userId = req.user.user_id;
    
    if (!service_ids || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service IDs harus berupa array' 
      });
    }
    
    connection = await getConnection();
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const serviceId of service_ids) {
      // Check if service exists
      const serviceCheck = await connection.execute(
        `SELECT service_id FROM SERVICES WHERE service_id = :serviceId AND status = 'active'`,
        { serviceId }
      );
      
      if (serviceCheck.rows.length === 0) {
        skippedCount++;
        continue;
      }
      
      // Check if already in wishlist
      const existingCheck = await connection.execute(
        `SELECT wishlist_id FROM WISHLIST 
         WHERE user_id = :userId AND service_id = :serviceId`,
        { userId, serviceId }
      );
      
      if (existingCheck.rows.length > 0) {
        skippedCount++;
        continue;
      }
      
      await connection.execute(
        `INSERT INTO WISHLIST (user_id, service_id)
         VALUES (:userId, :serviceId)`,
        { userId, serviceId }
      );
      addedCount++;
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `${addedCount} layanan berhasil ditambahkan ke wishlist, ${skippedCount} dilewati`,
      data: {
        added: addedCount,
        skipped: skippedCount
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('BULK ADD TO WISHLIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};