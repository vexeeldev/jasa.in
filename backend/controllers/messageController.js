const { getConnection } = require('../config/db');

// ================= GET CHAT LIST =================
exports.getChatList = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT DISTINCT 
         CASE 
           WHEN m.sender_id = :userId THEN m.receiver_id
           ELSE m.sender_id
         END as other_user_id,
         u.full_name as other_user_name, 
         u.avatar_url as other_user_avatar,
         u.role as other_user_role,
         (SELECT content FROM MESSAGES msg 
          WHERE msg.order_id = m.order_id 
          AND (msg.sender_id = :userId OR msg.receiver_id = :userId)
          ORDER BY msg.sent_at DESC FETCH FIRST 1 ROW ONLY) as last_message,
         (SELECT sent_at FROM MESSAGES msg 
          WHERE msg.order_id = m.order_id 
          AND (msg.sender_id = :userId OR msg.receiver_id = :userId)
          ORDER BY msg.sent_at DESC FETCH FIRST 1 ROW ONLY) as last_message_time,
         (SELECT COUNT(*) FROM MESSAGES msg 
          WHERE msg.order_id = m.order_id 
          AND msg.receiver_id = :userId 
          AND msg.is_read = '0') as unread_count,
         m.order_id,
         o.status as order_status,
         s.title as service_title,
         s.thumbnail_url as service_thumbnail,
         sp.package_name
       FROM MESSAGES m
       JOIN USERS u ON (CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END) = u.user_id
       JOIN ORDERS o ON m.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       WHERE m.sender_id = :userId OR m.receiver_id = :userId
       ORDER BY last_message_time DESC NULLS LAST`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({ success: true, data: result.rows });
    
  } catch (err) {
    console.error('GET CHAT LIST ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET MESSAGES BY ORDER =================
exports.getMessagesByOrder = async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const userId = req.user.user_id;
    const { page = 1, limit = 50 } = req.query;
    
    connection = await getConnection();
    
    // Verify user has access to this order
    const orderCheck = await connection.execute(
      `SELECT o.*, fp.user_id as freelancer_user_id
       FROM ORDERS o
       LEFT JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :orderId AND (o.client_id = :userId OR fp.user_id = :userId)`,
      { orderId, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses ke pesanan ini' });
    }
    
    const order = orderCheck.rows[0];
    
    // Mark unread messages as read
    await connection.execute(
      `UPDATE MESSAGES 
       SET is_read = '1' 
       WHERE order_id = :orderId AND receiver_id = :userId AND is_read = '0'`,
      { orderId, userId }
    );
    
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT m.*, 
              u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM MESSAGES m
       JOIN USERS u ON m.sender_id = u.user_id
       WHERE m.order_id = :orderId
       ORDER BY m.sent_at ASC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { orderId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM MESSAGES WHERE order_id = :orderId`,
      { orderId }
    );
    const total = countResult.rows[0]?.TOTAL || 0;
    
    await connection.commit();
    
    res.json({
      success: true,
      data: {
        messages: result.rows,
        order_info: {
          order_id: order.ORDER_ID,
          status: order.STATUS,
          total_price: order.TOTAL_PRICE,
          service_title: order.SERVICE_TITLE
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('GET MESSAGES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= SEND MESSAGE =================
exports.sendMessage = async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const { content } = req.body;
    const senderId = req.user.user_id;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
    }
    
    connection = await getConnection();
    
    // Get order details to find receiver
    const orderResult = await connection.execute(
      `SELECT o.client_id, o.freelancer_id, fp.user_id as freelancer_user_id,
              s.title as service_title
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :orderId`,
      { orderId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    
    const order = orderResult.rows[0];
    
    // Determine receiver
    let receiverId;
    if (order.CLIENT_ID === senderId) {
      receiverId = order.FREELANCER_USER_ID;
    } else if (order.FREELANCER_USER_ID === senderId) {
      receiverId = order.CLIENT_ID;
    } else {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // Insert message
    const messageResult = await connection.execute(
      `INSERT INTO MESSAGES (sender_id, receiver_id, order_id, content, is_read)
       VALUES (:senderId, :receiverId, :orderId, :content, '0')
       RETURNING message_id INTO :message_id`,
      {
        senderId,
        receiverId,
        orderId,
        content,
        message_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const messageId = messageResult.outBinds.message_id[0];
    
    // Create notification for receiver
    await connection.execute(
      `INSERT INTO NOTIFICATIONS (user_id, type, title, body)
       VALUES (:receiverId, 'message', 'Pesan Baru', 
               'Anda mendapat pesan baru terkait pesanan #' || :orderId)`,
      { receiverId, orderId }
    );
    
    await connection.commit();
    
    // Get the sent message with sender info
    const newMessage = await connection.execute(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM MESSAGES m
       JOIN USERS u ON m.sender_id = u.user_id
       WHERE m.message_id = :messageId`,
      { messageId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      message: 'Pesan berhasil dikirim',
      data: newMessage.rows[0]
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('SEND MESSAGE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= MARK MESSAGE AS READ =================
exports.markAsRead = async (req, res) => {
  let connection;
  try {
    const { messageId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `UPDATE MESSAGES 
       SET is_read = '1' 
       WHERE message_id = :messageId AND receiver_id = :userId AND is_read = '0'`,
      { messageId, userId }
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Pesan ditandai sebagai sudah dibaca' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= MARK ALL MESSAGES AS READ IN ORDER =================
exports.markAllAsRead = async (req, res) => {
  let connection;
  try {
    const { orderId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `UPDATE MESSAGES 
       SET is_read = '1' 
       WHERE order_id = :orderId AND receiver_id = :userId AND is_read = '0'`,
      { orderId, userId }
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Semua pesan ditandai sebagai sudah dibaca',
      updated_count: result.rowsAffected 
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
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
       FROM MESSAGES
       WHERE receiver_id = :userId AND is_read = '0'`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({ 
      success: true, 
      data: { unread_count: result.rows[0]?.UNREAD_COUNT || 0 }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE MESSAGE =================
exports.deleteMessage = async (req, res) => {
  let connection;
  try {
    const { messageId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Only sender can delete their own message
    const result = await connection.execute(
      `DELETE FROM MESSAGES 
       WHERE message_id = :messageId AND sender_id = :userId`,
      { messageId, userId }
    );
    
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan' });
    }
    
    res.json({ success: true, message: 'Pesan berhasil dihapus' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET CHAT PARTNER INFO =================
exports.getChatPartner = async (req, res) => {
  let connection;
  try {
    const { orderId, partnerId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Verify access
    const orderCheck = await connection.execute(
      `SELECT o.*, fp.user_id as freelancer_user_id
       FROM ORDERS o
       LEFT JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :orderId AND (o.client_id = :userId OR fp.user_id = :userId)`,
      { orderId, userId }
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const partnerResult = await connection.execute(
      `SELECT u.user_id, u.full_name, u.username, u.avatar_url, u.role,
              fp.rating_avg, fp.freelancer_level, fp.total_orders
       FROM USERS u
       LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
       WHERE u.user_id = :partnerId`,
      { partnerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner tidak ditemukan' });
    }
    
    res.json({ success: true, data: partnerResult.rows[0] });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= SEND TYPING INDICATOR =================
exports.sendTypingIndicator = async (req, res) => {
  // This would typically use WebSockets (Socket.io)
  // For REST API, just return success
  res.json({ success: true, message: 'Typing indicator sent' });
};