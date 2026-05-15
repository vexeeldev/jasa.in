const { getConnection } = require('../config/db');
const oracledb = require('oracledb');
const notificationController = require('./notificationController');

// ================= CREATE REVIEW (Client setelah order selesai) =================
exports.createReview = async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const { rating, review_comment } = req.body;
    const userId = req.user.user_id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating harus antara 1-5' 
      });
    }

    connection = await getConnection();

    // Verify order belongs to client and is completed
    const orderResult = await connection.execute(
      `SELECT o.order_id, o.freelancer_id, o.client_id, o.status,
              sp.service_id, s.title as service_title
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       WHERE o.order_id = :orderId 
         AND o.client_id = :userId 
         AND o.status = 'completed'`,
      { orderId, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order tidak ditemukan atau belum selesai' 
      });
    }

    const order = orderResult.rows[0];

    // 🔥 CEK APAKAH SUDAH ADA REVIEW - TAPI JANGAN LANGSUNG RETURN ERROR
    // Kita akan UPDATE jika sudah ada, INSERT jika belum
    const existingReview = await connection.execute(
      `SELECT review_id FROM REVIEWS WHERE order_id = :orderId`,
      { orderId }
    );

    let reviewId;
    
    if (existingReview.rows.length > 0) {
      // 🔥 UPDATE existing review (bukan error)
      reviewId = existingReview.rows[0].REVIEW_ID;
      await connection.execute(
        `UPDATE REVIEWS 
         SET rating = :rating, 
             review_comment = :review_comment,
             created_at = CURRENT_TIMESTAMP
         WHERE review_id = :reviewId`,
        {
          rating,
          review_comment: review_comment || null,
          reviewId
        }
      );
      
      console.log(`✅ Review updated for order ${orderId}`);
    } else {
      // 🔥 INSERT new review
      const reviewResult = await connection.execute(
        `INSERT INTO REVIEWS (order_id, reviewer_id, rating, review_comment)
         VALUES (:orderId, :reviewerId, :rating, :review_comment)
         RETURNING review_id INTO :review_id`,
        {
          orderId,
          reviewerId: userId,
          rating,
          review_comment: review_comment || null,
          review_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      reviewId = reviewResult.outBinds.review_id[0];
      console.log(`✅ New review created for order ${orderId}`);
    }

    // Update freelancer's rating_avg
    await connection.execute(
      `UPDATE FREELANCER_PROFILES fp
       SET rating_avg = (
         SELECT NVL(AVG(r.rating), 0) 
         FROM REVIEWS r
         JOIN ORDERS o ON r.order_id = o.order_id
         WHERE o.freelancer_id = fp.freelancer_id
       ),
       total_orders = (
         SELECT COUNT(*) 
         FROM ORDERS 
         WHERE freelancer_id = fp.freelancer_id AND status = 'completed'
       )
       WHERE fp.freelancer_id = :freelancerId`,
      { freelancerId: order.FREELANCER_ID }
    );

    await connection.commit();

    const notificationController = require('./notificationController');
    await notificationController.createNotification(
      order.FREELANCER_USER_ID,
      'review',
      'Ulasan Baru',
      `Anda menerima ulasan bintang ${rating} dari client untuk pesanan #${orderId}${review_comment ? `: "${review_comment.substring(0, 50)}${review_comment.length > 50 ? '...' : ''}"` : ''}`
    );

    res.json({
      success: true,
      message: existingReview.rows.length > 0 ? 'Review berhasil diupdate' : 'Review berhasil ditambahkan',
      data: { review_id: reviewId }
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CREATE/UPDATE REVIEW ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET REVIEWS BY SERVICE =================
exports.getReviewsByService = async (req, res) => {
  let connection;
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT r.review_id, r.order_id, r.rating, r.review_comment, r.created_at,
             u.user_id, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM REVIEWS r
      JOIN ORDERS o ON r.order_id = o.order_id
      JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
      JOIN USERS u ON r.reviewer_id = u.user_id
      WHERE sp.service_id = :serviceId
    `;
    
    const params = { serviceId };
    
    if (rating) {
      sql += ` AND r.rating = :rating`;
      params.rating = rating;
    }
    
    sql += ` ORDER BY r.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Get review statistics
    const statsResult = await connection.execute(
      `SELECT 
         COUNT(r.review_id) as total_reviews,
         NVL(AVG(r.rating), 0) as avg_rating,
         COUNT(CASE WHEN r.rating = 5 THEN 1 END) as rating_5,
         COUNT(CASE WHEN r.rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN r.rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN r.rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN r.rating = 1 THEN 1 END) as rating_1
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       WHERE sp.service_id = :serviceId`,
      { serviceId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(r.review_id) as total 
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       WHERE sp.service_id = :serviceId`,
      { serviceId }
    );
    const total = countResult.rows[0]?.TOTAL || 0;
    
    res.json({
      success: true,
      data: {
        reviews: result.rows,
        stats: statsResult.rows[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (err) {
    console.error('GET REVIEWS BY SERVICE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET REVIEWS BY FREELANCER =================
exports.getReviewsByFreelancer = async (req, res) => {
  let connection;
  try {
    const { freelancerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    connection = await getConnection();
    
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT r.review_id, r.order_id, r.rating, r.review_comment, r.created_at,
              u.user_id, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar,
              s.title as service_title, s.thumbnail_url
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN USERS u ON r.reviewer_id = u.user_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       WHERE o.freelancer_id = :freelancerId
       ORDER BY r.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { freelancerId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get stats
    const statsResult = await connection.execute(
      `SELECT 
         COUNT(r.review_id) as total_reviews,
         NVL(AVG(r.rating), 0) as avg_rating,
         COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as positive_reviews,
         COUNT(CASE WHEN r.rating <= 2 THEN 1 END) as negative_reviews
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       WHERE o.freelancer_id = :freelancerId`,
      { freelancerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(r.review_id) as total 
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       WHERE o.freelancer_id = :freelancerId`,
      { freelancerId }
    );
    const total = countResult.rows[0]?.TOTAL || 0;
    
    res.json({
      success: true,
      data: {
        reviews: result.rows,
        stats: statsResult.rows[0],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (err) {
    console.error('GET REVIEWS BY FREELANCER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET REVIEWS BY USER (Client melihat review yang dia buat) =================
exports.getMyReviews = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 10 } = req.query;
    
    connection = await getConnection();
    
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT r.review_id, r.order_id, r.rating, r.review_comment, r.created_at,
              s.title as service_title, s.thumbnail_url,
              u.full_name as freelancer_name, u.avatar_url as freelancer_avatar
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE r.reviewer_id = :userId
       ORDER BY r.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { userId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM REVIEWS WHERE reviewer_id = :userId`,
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
    console.error('GET MY REVIEWS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE REVIEW =================
// ================= UPDATE REVIEW =================
exports.updateReview = async (req, res) => {
  let connection;
  try {
    const { reviewId } = req.params;
    const { rating, review_comment } = req.body;
    const userId = req.user.user_id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating harus antara 1-5' 
      });
    }
    
    connection = await getConnection();
    
    // 🔥 CEK KEPEMILIKAN - JANGAN CEK APAKAH SUDAH ADA REVIEW LAGI
    const checkResult = await connection.execute(
      `SELECT r.*, o.freelancer_id
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       WHERE r.review_id = :reviewId AND r.reviewer_id = :userId`,
      { reviewId, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review tidak ditemukan atau bukan milik Anda' 
      });
    }
    
    const oldReview = checkResult.rows[0];
    
    // 🔥 UPDATE REVIEW - LANGSUNG UPDATE, TIDAK PERLU CEK LAGI
    await connection.execute(
      `UPDATE REVIEWS 
       SET rating = :rating, 
           review_comment = :review_comment
       WHERE review_id = :reviewId`,
      { rating, review_comment: review_comment || null, reviewId }
    );
    
    // Update freelancer's average rating
    await connection.execute(
      `UPDATE FREELANCER_PROFILES fp
       SET rating_avg = (
         SELECT NVL(AVG(r.rating), 0) 
         FROM REVIEWS r
         JOIN ORDERS o ON r.order_id = o.order_id
         WHERE o.freelancer_id = fp.freelancer_id
       )
       WHERE fp.freelancer_id = :freelancerId`,
      { freelancerId: oldReview.FREELANCER_ID }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Review berhasil diupdate'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE REVIEW ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE REVIEW =================
exports.deleteReview = async (req, res) => {
  let connection;
  try {
    const { reviewId } = req.params;
    const userId = req.user.user_id;
    const role = req.user.role;
    
    connection = await getConnection();
    
    // Check ownership or admin
    let checkResult;
    if (role === 'admin') {
      checkResult = await connection.execute(
        `SELECT r.*, o.freelancer_id
         FROM REVIEWS r
         JOIN ORDERS o ON r.order_id = o.order_id
         WHERE r.review_id = :reviewId`,
        { reviewId }
      );
    } else {
      checkResult = await connection.execute(
        `SELECT r.*, o.freelancer_id
         FROM REVIEWS r
         JOIN ORDERS o ON r.order_id = o.order_id
         WHERE r.review_id = :reviewId AND r.reviewer_id = :userId`,
        { reviewId, userId }
      );
    }
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review tidak ditemukan' 
      });
    }
    
    const review = checkResult.rows[0];
    
    await connection.execute(
      `DELETE FROM REVIEWS WHERE review_id = :reviewId`,
      { reviewId }
    );
    
    // Update freelancer's average rating
    await connection.execute(
      `UPDATE FREELANCER_PROFILES fp
       SET rating_avg = (
         SELECT NVL(AVG(r.rating), 0) 
         FROM REVIEWS r
         JOIN ORDERS o ON r.order_id = o.order_id
         WHERE o.freelancer_id = fp.freelancer_id
       )
       WHERE fp.freelancer_id = :freelancerId`,
      { freelancerId: review.FREELANCER_ID }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Review berhasil dihapus'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELETE REVIEW ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET REVIEW STATISTICS =================
exports.getReviewStats = async (req, res) => {
  let connection;
  try {
    const { freelancerId, serviceId } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT 
         COUNT(r.review_id) as total_reviews,
         NVL(AVG(r.rating), 0) as avg_rating,
         COUNT(CASE WHEN r.rating = 5 THEN 1 END) as rating_5,
         COUNT(CASE WHEN r.rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN r.rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN r.rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN r.rating = 1 THEN 1 END) as rating_1
      FROM REVIEWS r
    `;
    
    const params = {};
    
    if (freelancerId) {
      sql += ` JOIN ORDERS o ON r.order_id = o.order_id WHERE o.freelancer_id = :freelancerId`;
      params.freelancerId = freelancerId;
    } else if (serviceId) {
      sql += ` JOIN ORDERS o ON r.order_id = o.order_id 
               JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id 
               WHERE sp.service_id = :serviceId`;
      params.serviceId = serviceId;
    }
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    res.json({
      success: true,
      data: result.rows[0] || {
        total_reviews: 0,
        avg_rating: 0,
        rating_5: 0,
        rating_4: 0,
        rating_3: 0,
        rating_2: 0,
        rating_1: 0
      }
    });
    
  } catch (err) {
    console.error('GET REVIEW STATS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CHECK IF USER CAN REVIEW =================
exports.canReview = async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Check if order is completed and not reviewed yet
    const result = await connection.execute(
      `SELECT o.order_id, o.status,
              CASE WHEN r.review_id IS NOT NULL THEN 1 ELSE 0 END as already_reviewed
       FROM ORDERS o
       LEFT JOIN REVIEWS r ON o.order_id = r.order_id
       WHERE o.order_id = :orderId 
         AND o.client_id = :userId`,
      { orderId, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          can_review: false,
          reason: 'Order tidak ditemukan'
        }
      });
    }
    
    const order = result.rows[0];
    
    if (order.STATUS !== 'completed') {
      return res.json({
        success: true,
        data: {
          can_review: false,
          reason: 'Order belum selesai'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        can_review: order.ALREADY_REVIEWED === 0,
        already_reviewed: order.ALREADY_REVIEWED === 1
      }
    });
    
  } catch (err) {
    console.error('CAN REVIEW ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};
// ================= GET REVIEW BY ORDER ID =================
exports.getReviewByOrderId = async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT r.review_id, r.order_id, r.rating, r.review_comment, r.created_at,
              u.user_id, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM REVIEWS r
       JOIN USERS u ON r.reviewer_id = u.user_id
       WHERE r.order_id = :orderId`,
      { orderId: parseInt(orderId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Belum ada review'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (err) {
    console.error('GET REVIEW BY ORDER ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};
// ================= GET REVIEWS BY USER (Review yang DIBERIKAN user) =================
exports.getReviewsByUser = async (req, res) => {
  let connection;
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    connection = await getConnection();
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT r.review_id, r.order_id, r.rating, r.review_comment, r.created_at,
              s.title as service_title,
              u.full_name as freelancer_name, u.avatar_url as freelancer_avatar
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE r.reviewer_id = :userId
       ORDER BY r.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { userId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get stats
    const statsResult = await connection.execute(
      `SELECT 
         COUNT(*) as total_reviews,
         NVL(AVG(rating), 0) as avg_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
       FROM REVIEWS
       WHERE reviewer_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows,
      stats: statsResult.rows[0] || { total_reviews: 0, avg_rating: 0 }
    });
    
  } catch (err) {
    console.error('GET REVIEWS BY USER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};