const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// ================= GET ALL SERVICES =================
exports.getServices = async (req, res) => {
  let connection;
  try {
    const { 
      category, search, min_price, max_price, sort, 
      page = 1, limit = 12, freelancer_id, featured 
    } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT s.*, c.name as category_name, c.slug as category_slug,
             u.user_id as seller_id, u.full_name as seller_name, u.avatar_url as seller_avatar,
             fp.rating_avg as seller_rating, fp.total_orders as seller_orders, fp.freelancer_level,
             (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) as min_price
      FROM SERVICES s
      JOIN CATEGORIES c ON s.category_id = c.category_id
      JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
      JOIN USERS u ON fp.user_id = u.user_id
      WHERE s.status = 'active'
    `;
    
    const params = {};
    
    if (category) {
      sql += ` AND c.slug = :category`;
      params.category = category;
    }
    
    if (freelancer_id) {
      sql += ` AND s.freelancer_id = :freelancer_id`;
      params.freelancer_id = freelancer_id;
    }
    
    if (search) {
      sql += ` AND (LOWER(s.title) LIKE LOWER(:search) OR LOWER(s.description) LIKE LOWER(:search))`;
      params.search = `%${search}%`;
    }
    
    if (min_price) {
      sql += ` AND (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) >= :min_price`;
      params.min_price = min_price;
    }
    
    if (max_price) {
      sql += ` AND (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) <= :max_price`;
      params.max_price = max_price;
    }
    
    // Sorting
    switch(sort) {
      case 'popular':
        sql += ` ORDER BY s.total_orders DESC`;
        break;
      case 'rating':
        sql += ` ORDER BY fp.rating_avg DESC NULLS LAST`;
        break;
      case 'price-low':
        sql += ` ORDER BY min_price ASC`;
        break;
      case 'price-high':
        sql += ` ORDER BY min_price DESC`;
        break;
      case 'newest':
        sql += ` ORDER BY s.created_at DESC`;
        break;
      default:
        sql += ` ORDER BY s.created_at DESC`;
    }
    
    const offset = (page - 1) * limit;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Get packages for each service
    for (const service of result.rows) {
      const pkgResult = await connection.execute(
        `SELECT package_id, package_name, description, price, delivery_days, revisions 
         FROM SERVICE_PACKAGES 
         WHERE service_id = :service_id
         ORDER BY price ASC`,
        { service_id: service.SERVICE_ID }
      );
      service.PACKAGES = pkgResult.rows;
    }
    
    // Get total count
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
    console.error('GET SERVICES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET SERVICE BY ID =================
exports.getServiceById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT s.*, c.name as category_name, c.slug as category_slug,
              u.user_id as seller_id, u.username, u.full_name as seller_name, u.phone as seller_phone,
              u.avatar_url as seller_avatar, u.created_at as seller_joined,
              fp.bio as seller_bio, fp.rating_avg as seller_rating, 
              fp.total_orders as seller_total_orders, fp.freelancer_level
       FROM SERVICES s
       JOIN CATEGORIES c ON s.category_id = c.category_id
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE s.service_id = :id AND s.status = 'active'`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
    }
    
    const service = result.rows[0];
    
    // Get packages
    const pkgResult = await connection.execute(
      `SELECT package_id, package_name, description, price, delivery_days, revisions 
       FROM SERVICE_PACKAGES 
       WHERE service_id = :service_id
       ORDER BY price ASC`,
      { service_id: id }
    );
    service.PACKAGES = pkgResult.rows;
  
    // Get gallery    
    const galleryResult = await connection.execute(
      `SELECT image_url FROM SERVICE_GALLERY WHERE service_id = :service_id ORDER BY sort_order`,
      { service_id: id }
    );
    service.GALLERY = galleryResult.rows.map(g => g.IMAGE_URL);
    
    // Get reviews
    const reviewResult = await connection.execute(
      `SELECT r.*, u.full_name, u.avatar_url
       FROM REVIEWS r
       JOIN USERS u ON r.reviewer_id = u.user_id
       WHERE r.service_id = :service_id AND r.review_comment IS NOT NULL
       ORDER BY r.created_at DESC
       OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY`,
      { service_id: id }
    );
    service.REVIEWS = reviewResult.rows;
    
    // Get review stats
    const reviewStats = await connection.execute(
      `SELECT 
         COUNT(*) as total_reviews,
         NVL(AVG(rating), 0) as avg_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
       FROM REVIEWS
       WHERE service_id = :service_id`,
      { service_id: id }
    );
    service.REVIEW_STATS = reviewStats.rows[0];
    
    res.json({ success: true, data: service });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE SERVICE (Freelancer) =================
exports.createService = async (req, res) => {
  let connection;
  try {
    const { 
      category_id, title, description, thumbnail_url, 
      packages, gallery 
    } = req.body;
    const userId = req.user.user_id;
    
    if (!category_id || !title || !packages) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }
    
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
    
    // Insert service
    const serviceResult = await connection.execute(
      `INSERT INTO SERVICES 
       (freelancer_id, category_id, title, description, thumbnail_url, status)
       VALUES (:freelancer_id, :category_id, :title, :description, :thumbnail_url, 'active')
       RETURNING service_id INTO :service_id`,
      {
        freelancer_id: freelancerId,
        category_id,
        title,
        description,
        thumbnail_url,
        service_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const serviceId = serviceResult.outBinds.service_id[0];
    
    // Insert packages
    for (const pkg of packages) {
      await connection.execute(
        `INSERT INTO SERVICE_PACKAGES 
         (service_id, package_name, description, price, delivery_days, revisions)
         VALUES (:service_id, :package_name, :description, :price, :delivery_days, :revisions)`,
        {
          service_id: serviceId,
          package_name: pkg.package_name,
          description: pkg.description,
          price: pkg.price,
          delivery_days: pkg.delivery_days,
          revisions: pkg.revisions || 2
        }
      );
    }
    
    // Insert gallery
    if (gallery && gallery.length > 0) {
      for (let i = 0; i < gallery.length; i++) {
        await connection.execute(
          `INSERT INTO SERVICE_GALLERY (service_id, image_url, sort_order)
           VALUES (:service_id, :image_url, :sort_order)`,
          {
            service_id: serviceId,
            image_url: gallery[i],
            sort_order: i
          }
        );
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Service berhasil dibuat',
      data: { service_id: serviceId }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE SERVICE =================
exports.updateService = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { category_id, title, description, thumbnail_url, status } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Check ownership
    const checkResult = await connection.execute(
      `SELECT s.service_id 
       FROM SERVICES s
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE s.service_id = :id AND fp.user_id = :userId`,
      { id, userId }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    await connection.execute(
      `UPDATE SERVICES 
       SET category_id = COALESCE(:category_id, category_id),
           title = COALESCE(:title, title),
           description = COALESCE(:description, description),
           thumbnail_url = COALESCE(:thumbnail_url, thumbnail_url),
           status = COALESCE(:status, status)
       WHERE service_id = :id`,
      { category_id, title, description, thumbnail_url, status, id }
    );
    
    await connection.commit();
    
    res.json({ success: true, message: 'Service berhasil diupdate' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE SERVICE =================
exports.deleteService = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const checkResult = await connection.execute(
      `SELECT s.service_id 
       FROM SERVICES s
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE s.service_id = :id AND fp.user_id = :userId`,
      { id, userId }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    await connection.execute(`DELETE FROM SERVICES WHERE service_id = :id`, { id });
    await connection.commit();
    
    res.json({ success: true, message: 'Service berhasil dihapus' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE PACKAGES =================
exports.updatePackages = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { packages } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    const checkResult = await connection.execute(
      `SELECT s.service_id 
       FROM SERVICES s
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE s.service_id = :id AND fp.user_id = :userId`,
      { id, userId }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // Delete existing packages
    await connection.execute(`DELETE FROM SERVICE_PACKAGES WHERE service_id = :id`, { id });
    
    // Insert new packages
    for (const pkg of packages) {
      await connection.execute(
        `INSERT INTO SERVICE_PACKAGES 
         (service_id, package_name, description, price, delivery_days, revisions)
         VALUES (:service_id, :package_name, :description, :price, :delivery_days, :revisions)`,
        {
          service_id: id,
          package_name: pkg.package_name,
          description: pkg.description,
          price: pkg.price,
          delivery_days: pkg.delivery_days,
          revisions: pkg.revisions || 2
        }
      );
    }
    
    await connection.commit();
    
    res.json({ success: true, message: 'Paket berhasil diupdate' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};