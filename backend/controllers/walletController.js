const { getConnection } = require('../config/db');
const oracledb = require('oracledb');
const notificationController = require('./notificationController');

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// ================= GET WALLET BALANCE & STATS =================
exports.getWallet = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const userId = req.user.user_id;
    
    // Get balance
    const balanceResult = await connection.execute(
      `SELECT NVL(balance, 0) as balance FROM USERS WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // 🔥 PERBAIKI: Ambil pending escrow dari ESCROW_TRANSACTIONS
    const escrowResult = await connection.execute(
      `SELECT NVL(SUM(amount), 0) as pending_escrow
       FROM ESCROW_TRANSACTIONS et
       WHERE et.client_id = :userId AND et.status = 'HELD'`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total spent (order yang sudah selesai)
    const spentResult = await connection.execute(
      `SELECT NVL(SUM(total_price), 0) as total_spent
       FROM ORDERS
       WHERE client_id = :userId AND status = 'completed'`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log('📊 Wallet data:', {
      balance: balanceResult.rows[0]?.BALANCE,
      pending_escrow: escrowResult.rows[0]?.PENDING_ESCROW,
      total_spent: spentResult.rows[0]?.TOTAL_SPENT
    });
    
    res.json({
      success: true,
      data: {
        balance: Number(balanceResult.rows[0]?.BALANCE || 0),
        pending_escrow: Number(escrowResult.rows[0]?.PENDING_ESCROW || 0),
        total_spent: Number(spentResult.rows[0]?.TOTAL_SPENT || 0)
      }
    });
    
  } catch (err) {
    console.error('GET WALLET ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET TRANSACTION HISTORY =================
exports.getTransactions = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const userId = req.user.user_id;
    const { limit = 50, page = 1, type } = req.query;
    const offset = (page - 1) * limit;
    
    // 🔥 Hanya ambil kolom yang ADA di tabel
    let sql = `
      SELECT t.transaction_id, t.type, t.amount, t.reference_id, t.reference_type, 
             t.created_at
      FROM TRANSACTIONS t
      WHERE t.user_id = :userId
    `;
    
    const params = { userId, offset: Number(offset), limit: Number(limit) };
    
    if (type === 'credit') {
      sql += ` AND t.type = 'credit'`;
    } else if (type === 'debit') {
      sql += ` AND t.type = 'debit'`;
    }
    
    sql += ` ORDER BY t.created_at DESC
             OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total FROM TRANSACTIONS WHERE user_id = :userId
    `;
    const countResult = await connection.execute(countSql, { userId });
    const total = countResult.rows[0]?.TOTAL || 0;
    
    // Format response
    const formattedData = result.rows.map(row => ({
      TRANSACTION_ID: row.TRANSACTION_ID,
      TYPE: row.TYPE,
      AMOUNT: Number(row.AMOUNT),
      REFERENCE_ID: row.REFERENCE_ID,
      REFERENCE_TYPE: row.REFERENCE_TYPE,
      CREATED_AT: row.CREATED_AT,
      STATUS: 'completed', // default karena kolom tidak ada
      TITLE: row.REFERENCE_TYPE === 'topup' ? 'Top Up Saldo' :
             row.REFERENCE_TYPE === 'order' ? 'Pembelian Jasa' :
             row.REFERENCE_TYPE === 'refund' ? 'Refund Pesanan' :
             row.REFERENCE_TYPE === 'order_completed' ? 'Pembayaran Freelancer' :
             row.REFERENCE_TYPE === 'auto_refund' ? 'Auto Refund - Order Expired' : 'Transaksi'
    }));
    
    res.json({
      success: true,
      data: formattedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('GET TRANSACTIONS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= TOP UP SALDO =================
exports.topUp = async (req, res) => {
  let connection;
  try {
    const { amount, method } = req.body;
    const userId = req.user.user_id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah top up tidak valid' });
    }
    
    if (amount < 10000) {
      return res.status(400).json({ success: false, message: 'Minimal top up Rp 10.000' });
    }
    
    connection = await getConnection();
    
    // Update balance
    await connection.execute(
      `UPDATE USERS SET balance = NVL(balance, 0) + :amount WHERE user_id = :userId`,
      { amount, userId }
    );
    
    // 🔥 INSERT hanya kolom yang ADA
    await connection.execute(
      `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_type)
       VALUES (:userId, 'credit', :amount, 'topup')`,
      { userId, amount }
    );
    
    await connection.commit();
    
    // Get new balance
    const newBalance = await connection.execute(
      `SELECT balance FROM USERS WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const notificationController = require('./notificationController');
    await notificationController.createNotification(
      userId,
      'wallet',
      'Top Up Berhasil',
      `Saldo Anda bertambah Rp ${formatCurrency(amount)}. Saldo sekarang: Rp ${formatCurrency(newBalance)}`
    );
    
    res.json({
      success: true,
      message: 'Top up berhasil',
      data: { 
        amount: amount,
        new_balance: newBalance.rows[0]?.BALANCE || 0
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('TOPUP ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET SINGLE TRANSACTION =================
exports.getTransactionById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT t.transaction_id, t.type, t.amount, t.reference_id, t.reference_type, t.created_at
       FROM TRANSACTIONS t
       WHERE t.transaction_id = :id AND t.user_id = :userId`,
      { id, userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    
    const row = result.rows[0];
    const formattedData = {
      TRANSACTION_ID: row.TRANSACTION_ID,
      TYPE: row.TYPE,
      AMOUNT: Number(row.AMOUNT),
      REFERENCE_ID: row.REFERENCE_ID,
      REFERENCE_TYPE: row.REFERENCE_TYPE,
      CREATED_AT: row.CREATED_AT,
      TITLE: row.REFERENCE_TYPE === 'topup' ? 'Top Up Saldo' :
             row.REFERENCE_TYPE === 'order' ? 'Pembelian Jasa' :
             row.REFERENCE_TYPE === 'refund' ? 'Refund Pesanan' : 'Transaksi'
    };
    
    res.json({
      success: true,
      data: formattedData
    });
    
  } catch (err) {
    console.error('GET TRANSACTION BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET WITHDRAWABLE BALANCE =================
exports.getWithdrawableBalance = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const userId = req.user.user_id;
    
    const userResult = await connection.execute(
      `SELECT role FROM USERS WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const role = userResult.rows[0]?.ROLE;
    
    let withdrawable = 0;
    let pending = 0;
    
    if (role === 'freelancer') {
      const pendingResult = await connection.execute(
        `SELECT NVL(SUM(total_price), 0) as pending
         FROM ORDERS
         WHERE freelancer_id = (SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId)
         AND status = 'waiting_approval'`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      pending = pendingResult.rows[0]?.PENDING || 0;
    }
    
    const balanceResult = await connection.execute(
      `SELECT NVL(balance, 0) as balance FROM USERS WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const balance = balanceResult.rows[0]?.BALANCE || 0;
    withdrawable = balance - pending;
    
    res.json({
      success: true,
      data: {
        balance: balance,
        pending: pending,
        withdrawable: withdrawable > 0 ? withdrawable : 0
      }
    });
    
  } catch (err) {
    console.error('GET WITHDRAWABLE BALANCE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};