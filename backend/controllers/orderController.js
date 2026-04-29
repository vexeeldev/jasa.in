const { getConnection } = require('../config/db');

//================= GET ORDERS =================
exports.getOrders = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const role = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT o.*, 
             s.title as service_title, s.thumbnail_url,
             sp.package_name, sp.price as package_price, sp.delivery_days,
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
    
    const params = {};
    
    if (role === 'freelancer') {
      sql += ` AND o.freelancer_id = (SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId)`;
      params.userId = userId;
    } else {
      sql += ` AND o.client_id = :userId`;
      params.userId = userId;
    }
    
    if (status) {
      sql += ` AND o.status = :status`;
      params.status = status;
    }
    
    sql += ` ORDER BY o.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Get count
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/OFFSET.*$/, '');
    const countResult = await connection.execute(countSql, params);
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
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
    
    // Check permission
    const isClient = order.CLIENT_USER_ID === userId;
    const isFreelancer = order.FREELANCER_USER_ID === userId;
    
    if (!isClient && !isFreelancer && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // Get revision history
    const revisionsResult = await connection.execute(
      `SELECT * FROM ORDER_REVISIONS WHERE order_id = :order_id ORDER BY requested_at DESC`,
      { order_id: id }
    );
    order.REVISIONS = revisionsResult.rows;
    
    // Get delivery history
    const deliveriesResult = await connection.execute(
      `SELECT * FROM ORDER_DELIVERIES WHERE order_id = :order_id ORDER BY submitted_at DESC`,
      { order_id: id }
    );
    order.DELIVERIES = deliveriesResult.rows;
    
    // Get payment info
    const paymentResult = await connection.execute(
      `SELECT * FROM PAYMENTS WHERE order_id = :order_id`,
      { order_id: id }
    );
    order.PAYMENT = paymentResult.rows[0] || null;
    
    res.json({ success: true, data: order });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE ORDER (Checkout) =================
exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { package_id, requirements } = req.body;
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
    const serviceFee = Math.round(pkg.PRICE * 0.05); // 5% fee
    const totalPrice = pkg.PRICE + serviceFee;
    
    // Check client balance
    const balanceResult = await connection.execute(
      `SELECT balance FROM USERS WHERE user_id = :clientId`,
      { clientId }
    );
    
    const currentBalance = balanceResult.rows[0]?.BALANCE || 0;
    if (currentBalance < totalPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Saldo tidak mencukupi. Dibutuhkan ${formatCurrency(totalPrice)}` 
      });
    }
    
    // Calculate deadline
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + pkg.DELIVERY_DAYS);
    
    // Create order
    const orderResult = await connection.execute(
      `INSERT INTO ORDERS 
       (package_id, client_id, freelancer_id, total_price, deadline, requirements, status)
       VALUES (:package_id, :client_id, :freelancer_id, :total_price, :deadline, :requirements, 'pending')
       RETURNING order_id INTO :order_id`,
      {
        package_id,
        client_id: clientId,
        freelancer_id: pkg.FREELANCER_ID,
        total_price: totalPrice,
        deadline,
        requirements: requirements || null,
        order_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const orderId = orderResult.outBinds.order_id[0];
    
    // Hold balance (deduct from client)
    await connection.execute(
      `UPDATE USERS SET balance = balance - :totalPrice WHERE user_id = :clientId`,
      { totalPrice, clientId }
    );
    
    // Record transaction
    await connection.execute(
      `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
       VALUES (:clientId, 'debit', :totalPrice, :orderId, 'order')`,
      { clientId, totalPrice, orderId }
    );
    
    // Create notification for freelancer
    await connection.execute(
      `INSERT INTO NOTIFICATIONS (user_id, type, title, body)
       VALUES ((SELECT user_id FROM FREELANCER_PROFILES WHERE freelancer_id = :freelancerId),
               'order', 'Pesanan Baru', 'Anda mendapat pesanan baru untuk layanan ${pkg.SERVICE_TITLE}')`,
      { freelancerId: pkg.FREELANCER_ID }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Order berhasil dibuat',
      data: { order_id: orderId, total_price: totalPrice }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
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
    
    connection = await getConnection();
    
    // Verify freelancer owns this order
    const orderResult = await connection.execute(
      `SELECT o.*, fp.user_id as freelancer_user_id
       FROM ORDERS o
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE o.order_id = :id AND fp.user_id = :userId`,
      { id, userId }
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    const order = orderResult.rows[0];
    
    if (order.STATUS !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Order tidak dalam status pengerjaan' });
    }
    
    // Create delivery record
    await connection.execute(
      `INSERT INTO ORDER_DELIVERIES (order_id, message, attachments)
       VALUES (:order_id, :message, :attachments)`,
      { order_id: id, message, attachments: attachments ? JSON.stringify(attachments) : null }
    );
    
    // Update order status to waiting_approval
    await connection.execute(
      `UPDATE ORDERS SET status = 'waiting_approval' WHERE order_id = :id`,
      { id }
    );
    
    // Notify client
    await connection.execute(
      `INSERT INTO NOTIFICATIONS (user_id, type, title, body)
       VALUES (:clientId, 'delivery', 'Pekerjaan Dikirim', 
               'Freelancer telah mengirimkan hasil pekerjaan untuk order #${id}')`,
      { clientId: order.CLIENT_ID }
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Hasil pekerjaan berhasil dikirim' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
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