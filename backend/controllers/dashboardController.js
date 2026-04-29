const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// ================= CLIENT DASHBOARD =================
exports.getClientDashboard = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Order stats
    const orderStats = await connection.execute(
      `SELECT 
         COUNT(CASE WHEN status IN ('pending', 'in_progress', 'waiting_approval', 'revision') THEN 1 END) as active_orders,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
         NVL(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) as total_spent
       FROM ORDERS
       WHERE client_id = :userId`,
      { userId }
    );
    
    // Recent orders
    const recentOrders = await connection.execute(
      `SELECT o.order_id, o.status, o.total_price, o.created_at, s.title as service_title
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       WHERE o.client_id = :userId
       ORDER BY o.created_at DESC
       FETCH FIRST 5 ROWS ONLY`,
      { userId }
    );
    
    // Wishlist count
    const wishlistCount = await connection.execute(
      `SELECT COUNT(*) as count FROM WISHLIST WHERE user_id = :userId`,
      { userId }
    );
    
    res.json({
      success: true,
      data: {
        order_stats: orderStats.rows[0],
        recent_orders: recentOrders.rows,
        wishlist_count: wishlistCount.rows[0]?.COUNT || 0
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= FREELANCER DASHBOARD =================
exports.getFreelancerDashboard = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Get freelancer_id
    const freelancerResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId }
    );
    
    if (freelancerResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Anda bukan freelancer' });
    }
    
    const freelancerId = freelancerResult.rows[0].FREELANCER_ID;
    
    // Order stats
    const orderStats = await connection.execute(
      `SELECT 
         COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_orders,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
         NVL(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) as total_earned
       FROM ORDERS
       WHERE freelancer_id = :freelancerId`,
      { freelancerId }
    );
    
    // Recent orders
    const recentOrders = await connection.execute(
      `SELECT o.order_id, o.status, o.total_price, o.created_at, s.title as service_title,
              u.full_name as client_name
       FROM ORDERS o
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN USERS u ON o.client_id = u.user_id
       WHERE o.freelancer_id = :freelancerId
       ORDER BY o.created_at DESC
       FETCH FIRST 5 ROWS ONLY`,
      { freelancerId }
    );
    
    // Rating
    const rating = await connection.execute(
      `SELECT rating_avg, total_orders FROM FREELANCER_PROFILES WHERE freelancer_id = :freelancerId`,
      { freelancerId }
    );
    
    res.json({
      success: true,
      data: {
        order_stats: orderStats.rows[0],
        recent_orders: recentOrders.rows,
        rating: rating.rows[0]
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};