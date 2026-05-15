const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const checkExpiredOrders = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    // Cari order yang expired (pending > 24 jam dan escrow masih HELD)
    const expiredOrders = await connection.execute(
      `SELECT o.order_id, o.client_id, o.total_price, o.freelancer_id
       FROM ORDERS o
       WHERE o.status = 'pending' 
         AND o.created_at < (SYSTIMESTAMP - INTERVAL '24' HOUR)
         AND o.escrow_status = 'HELD'`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log(`📊 Found ${expiredOrders.rows.length} expired orders`);
    
    for (const order of expiredOrders.rows) {
      console.log(`🔄 Processing refund for order ${order.ORDER_ID}...`);
      
      // Refund ke client
      await connection.execute(
        `UPDATE USERS 
         SET balance = NVL(balance, 0) + :amount 
         WHERE user_id = :clientId`,
        { amount: order.TOTAL_PRICE, clientId: order.CLIENT_ID }
      );
      
      // Update status order
      await connection.execute(
        `UPDATE ORDERS 
         SET status = 'cancelled', 
             cancelled_at = CURRENT_TIMESTAMP,
             cancellation_reason = 'Auto refund - freelancer tidak merespon dalam 24 jam',
             escrow_status = 'REFUNDED'
         WHERE order_id = :orderId`,
        { orderId: order.ORDER_ID }
      );
      
      // Update escrow transactions
      await connection.execute(
        `UPDATE ESCROW_TRANSACTIONS 
         SET status = 'REFUNDED', 
             refunded_at = CURRENT_TIMESTAMP
         WHERE order_id = :orderId AND status = 'HELD'`,
        { orderId: order.ORDER_ID }  // 🔥 PERBAIKAN DI SINI - hapus kata "RICE"
      );
      
      // Catat transaksi refund
      await connection.execute(
        `INSERT INTO TRANSACTIONS (user_id, type, amount, reference_id, reference_type, status)
         VALUES (:clientId, 'credit', :amount, :orderId, 'auto_refund', 'completed')`,
        { clientId: order.CLIENT_ID, amount: order.TOTAL_PRICE, orderId: order.ORDER_ID }
      );
      
      console.log(`✅ Order ${order.ORDER_ID} refunded to client ${order.CLIENT_ID} (Rp ${order.TOTAL_PRICE.toLocaleString('id-ID')})`);
    }
    
    await connection.commit();
    
    return { success: true, refundedCount: expiredOrders.rows.length };
    
  } catch (err) {
    console.error('Error checking expired orders:', err);
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) await connection.close();
  }
};

module.exports = { checkExpiredOrders };