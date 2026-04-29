const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

//================= GET BALANCE =================
exports.getBalance = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT balance FROM USERS WHERE user_id = :userId`,
      { userId }
    );
    
    // Get pending escrow (orders in progress)
    const escrowResult = await connection.execute(
      `SELECT NVL(SUM(total_price), 0) as pending_escrow
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE (o.client_id = :userId OR fp.user_id = :userId)
         AND o.status IN ('pending', 'in_progress', 'waiting_approval', 'revision')`,
      { userId }
    );
    
    // Get total spent (client)
    const spentResult = await connection.execute(
      `SELECT NVL(SUM(total_price), 0) as total_spent
       FROM ORDERS
       WHERE client_id = :userId AND status = 'completed'`,
      { userId }
    );
    
    // Get total earned (freelancer)
    const earnedResult = await connection.execute(
      `SELECT NVL(SUM(o.total_price), 0) as total_earned
       FROM ORDERS o
       JOIN FREELANCER_PROFILES fp ON o.freelancer_id = fp.freelancer_id
       WHERE fp.user_id = :userId AND o.status = 'completed'`,
      { userId }
    );
    
    res.json({
      success: true,
      data: {
        balance: result.rows[0]?.BALANCE || 0,
        pending_escrow: escrowResult.rows[0]?.PENDING_ESCROW || 0,
        total_spent: spentResult.rows[0]?.TOTAL_SPENT || 0,
        total_earned: earnedResult.rows[0]?.TOTAL_EARNED || 0
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= TOP UP SALDO =================
exports.topUp = async (req, res) => {
  let connection;
  try {
    const { amount, payment_method } = req.body;
    const userId = req.user.user_id;
    
    if (!amount || amount < 10000) {
      return res.status(400).json({ success: false, message: 'Minimal top up Rp 10.000' });
    }
    
    connection = await getConnection();
    
    // Create topup record
    const topupResult = await connection.execute(
      `INSERT INTO TOPUPS (user_id, amount, payment_method, status)
       VALUES (:userId, :amount, :payment_method, 'pending')
       RETURNING topup_id INTO :topup_id`,
      {
        userId,
        amount,
        payment_method,
        topup_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const topupId = topupResult.outBinds.topup_id[0];
    
    await connection.commit();
    
    // TODO: Integrate with payment gateway (Midtrans, Xendit, etc)
    // For now, simulate success
    await connection.execute(
      `UPDATE TOPUPS 
       SET status = 'success', paid_at = CURRENT_TIMESTAMP, transaction_ref = :ref
       WHERE topup_id = :topupId`,
      { ref: `TOPUP-${topupId}`, topupId }
    );
    
    await connection.execute(
      `UPDATE USERS SET balance = balance + :amount WHERE user_id = :userId`,
      { amount, userId }
    );
    
    await connection.execute(
      `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
       VALUES (:userId, 'credit', :amount, :topupId, 'topup')`,
      { userId, amount, topupId }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Top up berhasil',
      data: { topup_id: topupId, amount }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= WITHDRAW SALDO (Freelancer) =================
exports.withdraw = async (req, res) => {
  let connection;
  try {
    const { amount, bank_name, account_number } = req.body;
    const userId = req.user.user_id;
    
    if (!amount || amount < 50000) {
      return res.status(400).json({ success: false, message: 'Minimal withdraw Rp 50.000' });
    }
    
    connection = await getConnection();
    
    // Get freelancer_id and balance
    const freelancerResult = await connection.execute(
      `SELECT fp.freelancer_id, u.balance
       FROM FREELANCER_PROFILES fp
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE fp.user_id = :userId`,
      { userId }
    );
    
    if (freelancerResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Anda bukan freelancer' });
    }
    
    const { FREELANCER_ID: freelancerId, BALANCE: currentBalance } = freelancerResult.rows[0];
    
    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi' });
    }
    
    // Create withdrawal record
    const withdrawResult = await connection.execute(
      `INSERT INTO WITHDRAWALS (freelancer_id, amount, bank_name, account_number, status)
       VALUES (:freelancerId, :amount, :bank_name, :account_number, 'pending')
       RETURNING withdrawal_id INTO :withdrawal_id`,
      {
        freelancerId,
        amount,
        bank_name,
        account_number,
        withdrawal_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const withdrawalId = withdrawResult.outBinds.withdrawal_id[0];
    
    // Deduct balance
    await connection.execute(
      `UPDATE USERS SET balance = balance - :amount WHERE user_id = :userId`,
      { amount, userId }
    );
    
    await connection.execute(
      `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type)
       VALUES (:userId, 'debit', :amount, :withdrawalId, 'withdrawal')`,
      { userId, amount, withdrawalId }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Permintaan withdraw berhasil diajukan',
      data: { withdrawal_id: withdrawalId, amount }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET TRANSACTION HISTORY =================
exports.getTransactionHistory = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const { type, page = 1, limit = 20 } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT t.*,
             CASE 
               WHEN t.reference_type = 'topup' THEN 'Top Up Saldo'
               WHEN t.reference_type = 'order' THEN 'Pembelian Jasa'
               WHEN t.reference_type = 'order_completed' THEN 'Pendapatan Jasa'
               WHEN t.reference_type = 'withdrawal' THEN 'Penarikan Dana'
               ELSE t.reference_type
             END as description
      FROM TRANSACTIONS t
      WHERE t.user_id = :userId
    `;
    
    const params = { userId };
    
    if (type && type !== 'all') {
      sql += ` AND t.type = :type`;
      params.type = type;
    }
    
    sql += ` ORDER BY t.created_at DESC`;
    
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

// ================= GET PAYMENT METHODS =================
exports.getPaymentMethods = async (req, res) => {
  // Return list of available payment methods
  res.json({
    success: true,
    data: [
      { id: 'balance', name: 'Saldo Jasa.in', icon: 'wallet', min_amount: 0 },
      { id: 'bank_transfer', name: 'Transfer Bank', icon: 'building', min_amount: 10000,
        banks: ['BCA', 'Mandiri', 'BRI', 'BNI', 'Permata'] },
      { id: 'qris', name: 'QRIS', icon: 'qrcode', min_amount: 5000 },
      { id: 'credit_card', name: 'Kartu Kredit', icon: 'credit-card', min_amount: 50000 }
    ]
  });
};

// ================= GET WITHDRAWAL HISTORY (Freelancer) =================
exports.getWithdrawalHistory = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT w.*, u.full_name
       FROM WITHDRAWALS w
       JOIN FREELANCER_PROFILES fp ON w.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE fp.user_id = :userId
       ORDER BY w.requested_at DESC`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({ success: true, data: result.rows });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};