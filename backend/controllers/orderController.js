const { getConnection } = require('../config/db');
const oracledb = require('oracledb');
const crypto = require('crypto');
const notificationController = require('./notificationController');

// Helper function untuk format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        name: req.file.originalname,
        url: fileUrl
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ================= GET ORDERS =================
exports.getOrders = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const role = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT o.order_id, o.status, o.total_price, o.created_at, o.deadline,
             sp.package_name, sp.price as package_price,
             s.title as service_title, s.thumbnail_url,
             u_seller.full_name as freelancer_name, u_seller.avatar_url as freelancer_avatar,
             u_buyer.full_name as client_name
      FROM ORDERS o
      JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
      JOIN SERVICES s ON sp.service_id = s.service_id
      JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
      JOIN USERS u_seller ON fp.user_id = u_seller.user_id
      JOIN USERS u_buyer ON o.client_id = u_buyer.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role === 'freelancer') {
      sql += ` AND u_seller.user_id = :userId`;
      params.push(userId);
    } else {
      sql += ` AND o.client_id = :userId`;
      params.push(userId);
    }
    
    if (status) {
      sql += ` AND o.status = :status`;
      params.push(status);
    }
    
    sql += ` ORDER BY o.created_at DESC`;
    
    const offset = (page - 1) * limit;
    const endRow = offset + limit;
    
    const finalSql = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          ${sql}
        ) a WHERE ROWNUM <= ${endRow}
      ) WHERE rnum > ${offset}
    `;
    
    const result = await connection.execute(finalSql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const cleanData = JSON.parse(JSON.stringify(result.rows));
    
    let countSql = `
      SELECT COUNT(*) as total
      FROM ORDERS o
      JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
      JOIN SERVICES s ON sp.service_id = s.service_id
      JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
      JOIN USERS u_seller ON fp.user_id = u_seller.user_id
      JOIN USERS u_buyer ON o.client_id = u_buyer.user_id
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (role === 'freelancer') {
      countSql += ` AND u_seller.user_id = :userId`;
      countParams.push(userId);
    } else {
      countSql += ` AND o.client_id = :userId`;
      countParams.push(userId);
    }
    
    if (status) {
      countSql += ` AND o.status = :status`;
      countParams.push(status);
    }
    
    const countResult = await connection.execute(countSql, countParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const total = countResult.rows[0]?.TOTAL || 0;
    
    res.json({
      success: true,
      data: cleanData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('GET ORDERS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET ORDER BY ID =================
exports.getOrderById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.role;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT o.*, 
              s.title as service_title, s.description as service_description, s.thumbnail_url,
              sp.package_name, sp.price as package_price, sp.delivery_days, sp.revisions,
              u_seller.user_id as freelancer_user_id, u_seller.full_name as freelancer_name, 
              u_seller.avatar_url as freelancer_avatar, u_seller.phone as freelancer_phone,
              u_buyer.user_id as client_user_id, u_buyer.full_name as client_name,
              u_buyer.avatar_url as client_avatar, u_buyer.phone as client_phone,
              fp.bio as freelancer_bio, fp.rating_avg as freelancer_rating
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       JOIN USERS u_seller ON fp.user_id = u_seller.user_id
       JOIN USERS u_buyer ON o.client_id = u_buyer.user_id
       WHERE o.order_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    
    const order = result.rows[0];
    
    const isClient = order.CLIENT_USER_ID === userId;
    const isFreelancer = order.FREELANCER_USER_ID === userId;
    
    if (!isClient && !isFreelancer && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const revisionsResult = await connection.execute(
      `SELECT revision_id, order_id, description, attachment_url, requested_at 
       FROM ORDER_REVISIONS 
       WHERE order_id = :order_id 
       ORDER BY requested_at DESC`,
      { order_id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    order.REVISIONS = revisionsResult.rows;
    
    const deliveriesResult = await connection.execute(
      `SELECT delivery_id, order_id, message, attachments, submitted_at 
       FROM ORDER_DELIVERIES 
       WHERE order_id = :order_id 
       ORDER BY submitted_at ASC`,
      { order_id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    order.DELIVERIES = deliveriesResult.rows.map(delivery => {
      let parsedAttachments = [];
      if (delivery.ATTACHMENTS) {
        try {
          if (typeof delivery.ATTACHMENTS === 'object') {
            parsedAttachments = delivery.ATTACHMENTS;
          } else {
            parsedAttachments = JSON.parse(delivery.ATTACHMENTS);
          }
        } catch (e) {
          console.error('Failed to parse attachments:', e);
        }
      }
      return {
        DELIVERY_ID: delivery.DELIVERY_ID,
        ORDER_ID: delivery.ORDER_ID,
        MESSAGE: delivery.MESSAGE,
        ATTACHMENTS: parsedAttachments,
        SUBMITTED_AT: delivery.SUBMITTED_AT
      };
    });
    
    const paymentResult = await connection.execute(
      `SELECT payment_id, order_id, amount, method, status, transaction_ref, paid_at 
       FROM PAYMENTS 
       WHERE order_id = :order_id`,
      { order_id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    order.PAYMENT = paymentResult.rows[0] || null;
    
    res.json({ success: true, data: order });
    
  } catch (err) {
    console.error('GET ORDER BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE ORDER =================
exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { package_id, requirements, payment_method } = req.body;
    const clientId = req.user.user_id;
    
    if (!package_id) {
      return res.status(400).json({ success: false, message: 'Paket tidak ditemukan' });
    }
    
    connection = await getConnection();
    
    // Get package details dengan freelancer_user_id
    const pkgResult = await connection.execute(
      `SELECT sp.*, s.freelancer_id, s.service_id, s.title as service_title,
              fp.user_id as freelancer_user_id
       FROM SERVICE_PACKAGES sp
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE sp.package_id = :package_id AND s.status = 'active'`,
      { package_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    }
    
    const pkg = pkgResult.rows[0];
    const serviceFee = Math.round(pkg.PRICE * 0.05);
    const totalPrice = pkg.PRICE + serviceFee;
    let paymentToken = null;
    let paymentExpiry = null;
    
    if (payment_method === 'qris') {
      paymentToken = crypto.randomBytes(32).toString('hex');
      paymentExpiry = new Date();
      paymentExpiry.setMinutes(paymentExpiry.getMinutes() + 15);
    }
    
    let currentBalance = 0;
    if (payment_method === 'balance') {
      const balanceResult = await connection.execute(
        `SELECT balance FROM USERS WHERE user_id = :clientId`,
        { clientId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      currentBalance = balanceResult.rows[0]?.BALANCE || 0;
      if (currentBalance < totalPrice) {
        return res.status(400).json({ 
          success: false, 
          message: `Saldo tidak mencukupi. Dibutuhkan Rp ${totalPrice.toLocaleString('id-ID')}` 
        });
      }
    }
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + pkg.DELIVERY_DAYS);
    const orderStatus = payment_method === 'balance' ? 'pending' : 'waiting_payment';
    
    const orderResult = await connection.execute(
      `INSERT INTO ORDERS 
       (package_id, client_id, freelancer_id, total_price, deadline, requirements, 
        status, payment_token, payment_expiry, escrow_status)
       VALUES (:package_id, :client_id, :freelancer_id, :total_price, :deadline, :requirements, 
               :status, :payment_token, :payment_expiry, 'PENDING')
       RETURNING order_id INTO :order_id`,
      {
        package_id,
        client_id: clientId,
        freelancer_id: pkg.FREELANCER_ID,
        total_price: totalPrice,
        deadline,
        requirements: requirements || null,
        status: orderStatus,
        payment_token: paymentToken,
        payment_expiry: paymentExpiry,
        order_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const orderId = orderResult.outBinds.order_id[0];
    
    if (payment_method === 'balance') {
      await connection.execute(
        `UPDATE USERS SET balance = NVL(balance, 0) - :totalPrice WHERE user_id = :clientId`,
        { totalPrice, clientId }
      );
      
      await connection.execute(
        `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
         VALUES (:clientId, 'debit', :totalPrice, :orderId, 'order')`,
        { clientId, totalPrice, orderId }
      );
      
      await connection.execute(
        `INSERT INTO ESCROW_TRANSACTIONS (order_id, client_id, freelancer_id, amount, status, created_at)
         VALUES (:orderId, :clientId, :freelancerId, :amount, 'HELD', CURRENT_TIMESTAMP)`,
        {
          orderId: orderId,
          clientId: clientId,
          freelancerId: pkg.FREELANCER_ID,
          amount: totalPrice
        }
      );
    }
    
    await connection.commit();
    
    // 🔥 NOTIFIKASI untuk freelancer
    await notificationController.createNotification(
      pkg.FREELANCER_USER_ID,
      'order',
      'Pesanan Baru!',
      `Anda mendapatkan pesanan baru untuk jasa "${pkg.SERVICE_TITLE}" senilai ${formatCurrency(totalPrice)}`
    );
    
    // 🔥 NOTIFIKASI untuk client
    await notificationController.createNotification(
      clientId,
      'order',
      'Pesanan Berhasil Dibuat',
      `Pesanan Anda untuk jasa "${pkg.SERVICE_TITLE}" telah berhasil dibuat. Dana ditahan hingga pekerjaan selesai.`
    );
    
    res.json({
      success: true,
      message: payment_method === 'balance' ? 'Pesanan berhasil dibuat. Dana ditahan hingga freelancer menyelesaikan pekerjaan.' : 'Order berhasil dibuat, silakan lakukan pembayaran',
      data: { 
        order_id: orderId, 
        total_price: totalPrice,
        payment_token: paymentToken,
        payment_method: payment_method
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CREATE ORDER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELIVER WORK (Freelancer) =================
exports.deliverWork = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Ambil detail order termasuk client_id
    const orderCheck = await connection.execute(
      `SELECT o.order_id, o.status, o.client_id, fp.user_id as freelancer_user_id
       FROM ORDERS o
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id 
         AND fp.user_id = :userId 
         AND TRIM(LOWER(o.status)) IN ('in_progress', 'revision')`,
      { id, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tidak memiliki akses atau order tidak dalam proses pengerjaan/revisi' 
      });
    }
    
    const order = orderCheck.rows[0];
    const attachmentsJson = attachments ? JSON.stringify(attachments) : null;
    
    await connection.execute(
      `INSERT INTO ORDER_DELIVERIES (order_id, message, attachments)
       VALUES (:order_id, :message, :attachments)`,
      { order_id: id, message: message || null, attachments: attachmentsJson }
    );
    
    await connection.execute(
      `UPDATE ORDERS SET status = 'waiting_approval' WHERE order_id = :id`,
      { id }
    );
    
    await connection.commit();
    
    // 🔥 NOTIFIKASI untuk client
    await notificationController.createNotification(
      order.CLIENT_ID,
      'delivery',
      'Hasil Pekerjaan Dikirim',
      `Freelancer telah mengirimkan hasil pekerjaan untuk pesanan #${id}. Silakan review pekerjaan.`
    );
    
    res.json({ 
      success: true, 
      message: order.STATUS === 'revision' ? 'Hasil revisi berhasil dikirim' : 'Hasil pekerjaan berhasil dikirim' 
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELIVER WORK ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= APPROVE ORDER (Client) =================
exports.approveOrder = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const orderResult = await connection.execute(
      `SELECT o.*, sp.service_id, fp.user_id as freelancer_user_id, o.client_id
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id AND o.client_id = :userId`,
      { id, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const order = orderResult.rows[0];
    const serviceId = order.SERVICE_ID;
    
    if (order.STATUS !== 'waiting_approval') {
      return res.status(400).json({ success: false, message: 'Order tidak menunggu persetujuan' });
    }
    
    await connection.execute(
      `UPDATE ORDERS 
       SET status = 'completed', 
           completed_at = CURRENT_TIMESTAMP,
           escrow_status = 'RELEASED'
       WHERE order_id = :id`,
      { id }
    );
    
    await connection.execute(
      `UPDATE SERVICES 
       SET total_orders = total_orders + 1
       WHERE service_id = :serviceId`,
      { serviceId }
    );
    
    await connection.execute(
      `UPDATE USERS u
       SET balance = NVL(u.balance, 0) + :orderTotal
       WHERE u.user_id = :freelancerUserId`,
      { 
        orderTotal: order.TOTAL_PRICE, 
        freelancerUserId: order.FREELANCER_USER_ID 
      }
    );
    
    await connection.execute(
      `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type, status)
       VALUES (:freelancerUserId, 'credit', :orderTotal, :id, 'order_completed', 'completed')`,
      { 
        freelancerUserId: order.FREELANCER_USER_ID, 
        orderTotal: order.TOTAL_PRICE, 
        id 
      }
    );
    
    await connection.execute(
      `UPDATE ESCROW_TRANSACTIONS 
       SET status = 'RELEASED', 
           released_at = CURRENT_TIMESTAMP
       WHERE order_id = :orderId AND status = 'HELD'`,
      { orderId: id }
    );
    
    await connection.commit();
    
    // 🔥 NOTIFIKASI untuk freelancer
    await notificationController.createNotification(
      order.FREELANCER_USER_ID,
      'completed',
      'Pesanan Selesai!',
      `Pesanan #${id} telah disetujui client. Dana ${formatCurrency(order.TOTAL_PRICE)} telah masuk ke saldo Anda.`
    );
    
    // 🔥 NOTIFIKASI untuk client
    await notificationController.createNotification(
      order.CLIENT_ID,
      'completed',
      'Pesanan Selesai',
      `Pesanan #${id} telah selesai. Terima kasih telah menggunakan jasa.in!`
    );
    
    res.json({ 
      success: true, 
      message: 'Pesanan disetujui! Dana telah dicairkan ke freelancer.' 
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('APPROVE ORDER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= REQUEST REVISION (Client) =================
exports.requestRevision = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { description, attachment_url } = req.body;
    const userId = req.user.user_id;
    
    if (!description) {
      return res.status(400).json({ success: false, message: 'Deskripsi revisi wajib diisi' });
    }
    
    connection = await getConnection();
    
    const orderResult = await connection.execute(
      `SELECT o.*, sp.revisions as max_revisions, fp.user_id as freelancer_user_id,
              (SELECT COUNT(*) FROM ORDER_REVISIONS WHERE order_id = o.order_id) as revision_count
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id AND o.client_id = :userId`,
      { id, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const order = orderResult.rows[0];
    
    if (order.STATUS !== 'waiting_approval') {
      return res.status(400).json({ success: false, message: 'Order tidak dalam status menunggu persetujuan' });
    }
    
    const maxRevisions = order.MAX_REVISIONS;
    const currentRevisions = order.REVISION_COUNT;
    
    if (maxRevisions !== 999 && currentRevisions >= maxRevisions) {
      return res.status(400).json({ success: false, message: 'Revisi sudah mencapai batas maksimal' });
    }
    
    await connection.execute(
      `INSERT INTO ORDER_REVISIONS (order_id, description, attachment_url)
       VALUES (:order_id, :description, :attachment_url)`,
      { order_id: id, description, attachment_url }
    );
    
    await connection.execute(
      `UPDATE ORDERS SET status = 'revision' WHERE order_id = :id`,
      { id }
    );
    
    await connection.commit();
    
    // 🔥 NOTIFIKASI untuk freelancer
    await notificationController.createNotification(
      order.FREELANCER_USER_ID,
      'revision',
      'Revisi Diminta',
      `Client meminta revisi untuk pesanan #${id} dengan catatan: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`
    );
    
    res.json({ success: true, message: 'Permintaan revisi berhasil dikirim' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('REQUEST REVISION ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CANCEL ORDER =================
exports.cancelOrder = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.role;
    const { reason } = req.body;
    
    connection = await getConnection();
    
    const orderResult = await connection.execute(
      `SELECT o.*, fp.user_id as freelancer_user_id
       FROM ORDERS o
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    
    const order = orderResult.rows[0];
    const isClient = order.CLIENT_ID === userId;
    const isFreelancer = order.FREELANCER_USER_ID === userId;
    
    if (!isClient && !isFreelancer && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const allowedStatuses = ['pending', 'in_progress', 'waiting_payment'];
    if (!allowedStatuses.includes(order.STATUS)) {
      return res.status(400).json({ 
        success: false, 
        message: `Order dengan status "${order.STATUS}" tidak dapat dibatalkan` 
      });
    }
    
    await connection.execute(
      `UPDATE ORDERS 
       SET status = 'cancelled', 
           cancelled_at = CURRENT_TIMESTAMP,
           cancellation_reason = :reason,
           cancellation_by = :cancelledBy,
           escrow_status = 'REFUNDED'
       WHERE order_id = :id`,
      { 
        id, 
        reason: reason || (isClient ? 'Dibatalkan oleh client' : 'Dibatalkan oleh freelancer'),
        cancelledBy: isClient ? 'client' : (isFreelancer ? 'freelancer' : 'admin')
      }
    );
    
    let refundMessage = '';
    
    if (order.TOTAL_PRICE > 0 && (order.STATUS === 'pending' || order.STATUS === 'in_progress')) {
      await connection.execute(
        `UPDATE USERS 
         SET balance = NVL(balance, 0) + :orderTotal 
         WHERE user_id = :clientId`,
        { orderTotal: order.TOTAL_PRICE, clientId: order.CLIENT_ID }
      );
      
      await connection.execute(
        `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
         VALUES (:clientId, 'credit', :orderTotal, :id, 'refund')`,
        { clientId: order.CLIENT_ID, orderTotal: order.TOTAL_PRICE, id }
      );
      
      await connection.execute(
        `UPDATE ESCROW_TRANSACTIONS 
         SET status = 'REFUNDED', 
             refunded_at = CURRENT_TIMESTAMP
         WHERE order_id = :orderId AND status IN ('PENDING', 'HELD')`,
        { orderId: id }
      );
      
      refundMessage = ' Dana telah dikembalikan ke saldo Anda.';
    }
    
    if (order.STATUS === 'waiting_payment') {
      await connection.execute(
        `UPDATE ORDERS 
         SET payment_token = NULL, 
             payment_expiry = NULL
         WHERE order_id = :id`,
        { id }
      );
    }
    
    await connection.commit();
    
    // 🔥 NOTIFIKASI untuk client
    await notificationController.createNotification(
      order.CLIENT_ID,
      'cancellation',
      'Pesanan Dibatalkan',
      `Pesanan #${id} telah dibatalkan.${refundMessage}`
    );
    
    // 🔥 NOTIFIKASI untuk freelancer (jika sudah masuk proses)
    if (order.STATUS === 'in_progress') {
      await notificationController.createNotification(
        order.FREELANCER_USER_ID,
        'cancellation',
        'Pesanan Dibatalkan',
        `Pesanan #${id} telah dibatalkan oleh client.`
      );
    }
    
    let message = 'Pesanan berhasil dibatalkan';
    if (order.TOTAL_PRICE > 0 && (order.STATUS === 'pending' || order.STATUS === 'in_progress')) {
      message += ' Dana telah dikembalikan ke saldo Anda.';
    }
    
    res.json({ 
      success: true, 
      message: message
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CANCEL ORDER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE ORDER STATUS =================
exports.updateOrderStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.user_id;
    const role = req.user.role;
    
    const validStatuses = ['pending', 'in_progress', 'waiting_approval', 'revision', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    
    connection = await getConnection();
    
    const orderResult = await connection.execute(
      `SELECT o.*, fp.user_id as freelancer_user_id, o.client_id
       FROM ORDERS o
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    
    const order = orderResult.rows[0];
    const isClient = order.CLIENT_ID === userId;
    const isFreelancer = order.FREELANCER_USER_ID === userId;
    
    if (!isClient && !isFreelancer && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    if (role === 'freelancer' && !['in_progress', 'waiting_approval', 'revision'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Freelancer tidak dapat mengubah ke status ini' });
    }
    
    if (role === 'client' && !['revision', 'completed', 'cancelled'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Client tidak dapat mengubah ke status ini' });
    }
    
    await connection.execute(
      `UPDATE ORDERS SET status = :status WHERE order_id = :id`,
      { status, id }
    );
    
    if (status === 'in_progress') {
      await notificationController.createNotification(
        order.CLIENT_ID,
        'order',
        'Pesanan Diproses',
        `Pesanan #${id} sedang dikerjakan oleh freelancer.`
      );
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Status order berhasil diupdate' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET ORDER TRACKING =================
exports.getOrderTracking = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const orderResult = await connection.execute(
      `SELECT o.*, sp.delivery_days
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       WHERE o.order_id = :id AND (o.client_id = :userId OR o.freelancer_id = 
             (SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId))`,
      { id, userId }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    
    const order = orderResult.rows[0];
    
    const statusSteps = {
      'pending': 10,
      'in_progress': 30,
      'waiting_approval': 70,
      'revision': 50,
      'completed': 100,
      'cancelled': 0
    };
    
    const timeline = [
      { status: 'pending', label: 'Pesanan Dibuat', timestamp: order.CREATED_AT, completed: true },
      { status: 'in_progress', label: 'Sedang Dikerjakan', timestamp: null, completed: ['in_progress', 'waiting_approval', 'revision', 'completed'].includes(order.STATUS) }
    ];
    
    const deliveries = await connection.execute(
      `SELECT * FROM ORDER_DELIVERIES WHERE order_id = :id ORDER BY submitted_at ASC`,
      { id }
    );
    
    if (deliveries.rows.length > 0) {
      timeline.push({ 
        status: 'waiting_approval', 
        label: 'Menunggu Persetujuan', 
        timestamp: deliveries.rows[0].SUBMITTED_AT,
        completed: ['completed'].includes(order.STATUS)
      });
    }
    
    if (order.STATUS === 'completed') {
      timeline.push({ status: 'completed', label: 'Pesanan Selesai', timestamp: order.COMPLETED_AT, completed: true });
    }
    
    res.json({
      success: true,
      data: {
        order_id: id,
        status: order.STATUS,
        progress: statusSteps[order.STATUS] || 0,
        timeline,
        deadline: order.DEADLINE,
        current_date: new Date()
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= AUTO REFUND EXPIRED ORDERS =================
exports.autoRefundExpiredOrders = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const expiredOrders = await connection.execute(
      `SELECT o.order_id, o.client_id, o.total_price, o.freelancer_id
       FROM ORDERS o
       WHERE o.status = 'pending' 
         AND o.created_at < (SYSTIMESTAMP - INTERVAL '24' HOUR)
         AND o.escrow_status = 'HELD'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    for (const order of expiredOrders.rows) {
      await connection.execute(
        `UPDATE USERS 
         SET balance = balance + :amount 
         WHERE user_id = :clientId`,
        { amount: order.TOTAL_PRICE, clientId: order.CLIENT_ID }
      );
      
      await connection.execute(
        `UPDATE ORDERS 
         SET status = 'cancelled', 
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = 'Auto refund - freelancer tidak merespon dalam 24 jam',
             escrow_status = 'REFUNDED'
         WHERE order_id = :orderId`,
        { orderId: order.ORDER_ID }
      );
      
      await connection.execute(
        `UPDATE ESCROW_TRANSACTIONS 
         SET status = 'REFUNDED', 
             refunded_at = CURRENT_TIMESTAMP
         WHERE order_id = :orderId AND status = 'HELD'`,
        { orderId: order.ORDER_ID }
      );
      
      // 🔥 NOTIFIKASI untuk client (auto refund)
      await notificationController.createNotification(
        order.CLIENT_ID,
        'cancellation',
        'Pesanan Dibatalkan Otomatis',
        `Pesanan #${order.ORDER_ID} dibatalkan otomatis karena freelancer tidak merespon dalam 24 jam. Dana telah dikembalikan ke saldo Anda.`
      );
      
      console.log(`✅ Auto refunded order ${order.ORDER_ID} to client ${order.CLIENT_ID}`);
    }
    
    await connection.commit();
    
  } catch (err) {
    console.error('AUTO REFUND ERROR:', err);
  } finally {
    if (connection) await connection.close();
  }
};