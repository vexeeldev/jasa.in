const { getConnection } = require('../config/db');
const oracledb = require('oracledb');
const crypto = require('crypto');

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

//================= GET ORDERS =================
// ================= GET ORDERS =================
exports.getOrders = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const role = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;
    
    connection = await getConnection();
    
    // 🔥 BUILD QUERY DINAMIS DENGAN BIND YANG BENAR
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
    
    // 🔥 Pagination dengan ROWNUM (Oracle)
    const offset = (page - 1) * limit;
    const endRow = offset + limit;
    
    const finalSql = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          ${sql}
        ) a WHERE ROWNUM <= ${endRow}
      ) WHERE rnum > ${offset}
    `;
    
    console.log('Executing SQL with params:', params);
    
    const result = await connection.execute(finalSql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const cleanData = JSON.parse(JSON.stringify(result.rows));
    
    // 🔥 Count total (query terpisah)
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
    
    console.log('🔍 getOrderById - Order ID:', id);
    console.log('🔍 User ID:', userId);
    
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
    
    // Check permission
    const isClient = order.CLIENT_USER_ID === userId;
    const isFreelancer = order.FREELANCER_USER_ID === userId;
    
    if (!isClient && !isFreelancer && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // Get revision history
    const revisionsResult = await connection.execute(
      `SELECT revision_id, order_id, description, attachment_url, requested_at 
       FROM ORDER_REVISIONS 
       WHERE order_id = :order_id 
       ORDER BY requested_at DESC`,
      { order_id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    order.REVISIONS = revisionsResult.rows;
    
    // 🔥 Get delivery history dengan debug
    const deliveriesResult = await connection.execute(
      `SELECT delivery_id, order_id, message, attachments, submitted_at 
       FROM ORDER_DELIVERIES 
       WHERE order_id = :order_id 
       ORDER BY submitted_at ASC`,
      { order_id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log('📦 Deliveries found:', deliveriesResult.rows.length);
    
    // Parse attachments dari JSON string ke array
    order.DELIVERIES = deliveriesResult.rows.map(delivery => {
      let parsedAttachments = [];
      if (delivery.ATTACHMENTS) {
        try {
          // Jika sudah object, langsung pakai
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
    
    console.log('✅ DELIVERIES to send:', order.DELIVERIES.length);
    
    // Get payment info
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
// ================= CREATE ORDER (Checkout) =================
exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { package_id, requirements, payment_method } = req.body;
    const clientId = req.user.user_id;
    
    if (!package_id) {
      return res.status(400).json({ success: false, message: 'Paket tidak ditemukan' });
    }
    
    connection = await getConnection();
    
    // Get package details
    const pkgResult = await connection.execute(
      `SELECT sp.*, s.freelancer_id, s.service_id, s.title as service_title
       FROM SERVICE_PACKAGES sp
       JOIN SERVICES s ON sp.service_id = s.service_id
       WHERE sp.package_id = :package_id AND s.status = 'active'`,
      { package_id }
    );
    
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    }
    
    const pkg = pkgResult.rows[0];
    const serviceFee = Math.round(pkg.PRICE * 0.05);
    const totalPrice = pkg.PRICE + serviceFee;
    let paymentToken = null;
    let paymentExpiry = null;
    
    // 🔥 Jika QRIS, generate token unik
    if (payment_method === 'qris') {
      paymentToken = crypto.randomBytes(32).toString('hex');
      paymentExpiry = new Date();
      paymentExpiry.setMinutes(paymentExpiry.getMinutes() + 15); // expired 15 menit
    }
    
    // Check balance hanya jika pakai saldo
    if (payment_method === 'balance') {
      const balanceResult = await connection.execute(
        `SELECT balance FROM USERS WHERE user_id = :clientId`,
        { clientId }
      );
      
      const currentBalance = balanceResult.rows[0]?.BALANCE || 0;
      if (currentBalance < totalPrice) {
        return res.status(400).json({ 
          success: false, 
          message: `Saldo tidak mencukupi. Dibutuhkan Rp ${totalPrice.toLocaleString('id-ID')}` 
        });
      }
    }
    
    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + pkg.DELIVERY_DAYS);
    
    // Status berdasarkan metode pembayaran
    const orderStatus = payment_method === 'balance' ? 'pending' : 'waiting_payment';
    
    // Create order
    const orderResult = await connection.execute(
      `INSERT INTO ORDERS 
       (package_id, client_id, freelancer_id, total_price, deadline, requirements, status, payment_token, payment_expiry)
       VALUES (:package_id, :client_id, :freelancer_id, :total_price, :deadline, :requirements, :status, :payment_token, :payment_expiry)
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
    
    // Jika pakai balance, potong saldo
    if (payment_method === 'balance') {
      await connection.execute(
        `UPDATE USERS SET balance = balance - :totalPrice WHERE user_id = :clientId`,
        { totalPrice, clientId }
      );
      
      await connection.execute(
        `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
         VALUES (:clientId, 'debit', :totalPrice, :orderId, 'order')`,
        { clientId, totalPrice, orderId }
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Order berhasil dibuat',
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
    res.status(500).json({ success: false, message: 'Server error' });
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
    
    // Get order details
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
    
    // Check permission
    const isClient = order.CLIENT_ID === userId;
    const isFreelancer = order.FREELANCER_USER_ID === userId;
    
    if (!isClient && !isFreelancer && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // Validate status transitions
    if (role === 'freelancer' && !['in_progress', 'waiting_approval', 'revision'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Freelancer tidak dapat mengubah ke status ini' });
    }
    
    if (role === 'klien' && !['revision', 'completed', 'cancelled'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Client tidak dapat mengubah ke status ini' });
    }
    
    await connection.execute(
      `UPDATE ORDERS SET status = :status WHERE order_id = :id`,
      { status, id }
    );
    
    // If completed, release escrow to freelancer
    if (status === 'completed') {
      const freelancerId = order.FREELANCER_ID;
      const orderTotal = order.TOTAL_PRICE;
      
      await connection.execute(
        `UPDATE USERS u
         SET u.balance = u.balance + :orderTotal
         WHERE u.user_id = (SELECT user_id FROM FREELANCER_PROFILES WHERE freelancer_id = :freelancerId)`,
        { orderTotal, freelancerId }
      );
      
      await connection.execute(
        `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
         VALUES ((SELECT user_id FROM FREELANCER_PROFILES WHERE freelancer_id = :freelancerId),
                 'credit', :orderTotal, :id, 'order_completed')`,
        { freelancerId, orderTotal, id }
      );
      
      await connection.execute(
        `UPDATE ORDERS SET completed_at = CURRENT_TIMESTAMP WHERE order_id = :id`,
        { id }
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

// ================= DELIVER WORK (Freelancer) =================
exports.deliverWork = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user.user_id;
    
    console.log('========================================');
    console.log('📦 DELIVER WORK STARTED');
    console.log('Order ID:', id);
    console.log('User ID dari token:', userId);
    
    connection = await getConnection();
    
    // Cek apakah freelancer ini mengerjakan order ini (IZINKAN in_progress ATAU revision)
    const orderCheck = await connection.execute(
      `SELECT o.order_id, o.status, fp.user_id as freelancer_user_id
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
    
    // Simpan delivery
    const attachmentsJson = attachments ? JSON.stringify(attachments) : null;
    
    await connection.execute(
      `INSERT INTO ORDER_DELIVERIES (order_id, message, attachments)
       VALUES (:order_id, :message, :attachments)`,
      { order_id: id, message: message || null, attachments: attachmentsJson }
    );
    
    // Update status order jadi 'waiting_approval'
    await connection.execute(
      `UPDATE ORDERS SET status = 'waiting_approval' WHERE order_id = :id`,
      { id }
    );
    
    await connection.commit();
    
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
    
    // Verify client owns this order
    const orderResult = await connection.execute(
      `SELECT * FROM ORDERS WHERE order_id = :id AND client_id = :userId`,
      { id, userId }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const order = orderResult.rows[0];
    
    if (order.STATUS !== 'waiting_approval') {
      return res.status(400).json({ success: false, message: 'Order tidak menunggu persetujuan' });
    }
    
    await connection.execute(
      `UPDATE ORDERS SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE order_id = :id`,
      { id }
    );
    
    // Release escrow to freelancer
    await connection.execute(
      `UPDATE USERS u
       SET u.balance = u.balance + :orderTotal
       WHERE u.user_id = (SELECT user_id FROM FREELANCER_PROFILES WHERE freelancer_id = :freelancerId)`,
      { orderTotal: order.TOTAL_PRICE, freelancerId: order.FREELANCER_ID }
    );
    
    await connection.execute(
      `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
       VALUES ((SELECT user_id FROM FREELANCER_PROFILES WHERE freelancer_id = :freelancerId),
               'credit', :orderTotal, :id, 'order_completed')`,
      { freelancerId: order.FREELANCER_ID, orderTotal: order.TOTAL_PRICE, id }
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Pesanan disetujui dan selesai' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
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
      `SELECT o.*, sp.revisions as max_revisions,
              (SELECT COUNT(*) FROM ORDER_REVISIONS WHERE order_id = o.order_id) as revision_count
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       WHERE o.order_id = :id AND o.client_id = :userId`,
      { id, userId }
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
    
    res.json({ success: true, message: 'Permintaan revisi berhasil dikirim' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
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
    
    connection = await getConnection();
    
    const orderResult = await connection.execute(
      `SELECT o.*, fp.user_id as freelancer_user_id
       FROM ORDERS o
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id`,
      { id }
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
    
    const allowedStatuses = ['pending', 'in_progress'];
    if (!allowedStatuses.includes(order.STATUS)) {
      return res.status(400).json({ success: false, message: 'Order tidak dapat dibatalkan' });
    }
    
    await connection.execute(`UPDATE ORDERS SET status = 'cancelled' WHERE order_id = :id`, { id });
    
    // Refund to client if already paid
    if (order.TOTAL_PRICE > 0) {
      await connection.execute(
        `UPDATE USERS SET balance = balance + :orderTotal WHERE user_id = :clientId`,
        { orderTotal: order.TOTAL_PRICE, clientId: order.CLIENT_ID }
      );
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Pesanan berhasil dibatalkan' });
    
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
    
    // Calculate progress
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
    
    // Get delivery history
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
