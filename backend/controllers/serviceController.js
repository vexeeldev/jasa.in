const { getConnection } = require('../config/db');
const oracledb = require('oracledb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ================= GET ALL SERVICES =================
// ================= GET ALL SERVICES (with filters) =================
exports.getServices = async (req, res) => {
  let connection;
  try {
    const { 
      page = 1, 
      limit = 12,
      category,
      search,
      budget,
      delivery,
      level,
      sort
    } = req.query;
    
    console.log('📊 FILTERS:', { category, search, budget, delivery, level, sort });
    
    connection = await getConnection();
    
    // 🔥 AMBIL SEMUA DATA DULU dengan JOIN
    let sql = `
      SELECT s.service_id, s.freelancer_id, s.category_id, s.title, s.description,
             s.thumbnail_url, s.status, s.total_orders, s.created_at,
             c.name as category_name, c.slug as category_slug,
             u.user_id as seller_id, u.full_name as seller_name, u.avatar_url as seller_avatar,
             fp.rating_avg as seller_rating, fp.total_orders as seller_orders, fp.freelancer_level,
             (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) as min_price
      FROM SERVICES s
      JOIN CATEGORIES c ON s.category_id = c.category_id
      JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
      JOIN USERS u ON fp.user_id = u.user_id
      WHERE s.status = 'active'
    `;
    
    const params = [];
    
    // Category filter
    if (category) {
      sql += ` AND c.slug = :category`;
      params.push(category);
    }
    
    // Search filter
    if (search) {
      sql += ` AND LOWER(s.title) LIKE LOWER(:search)`;
      params.push(`%${search}%`);
    }
    
    // Level filter
    if (level === 'top') {
      sql += ` AND fp.freelancer_level = 'top'`;
    } else if (level === 'high') {
      sql += ` AND fp.freelancer_level IN ('top', 'pro', 'high')`;
    } else if (level === 'new') {
      sql += ` AND fp.freelancer_level = 'new'`;
    }
    
    // Execute query
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    let allServices = JSON.parse(JSON.stringify(result.rows));
    
    console.log(`📊 Total services before filters: ${allServices.length}`);
    
    // 🔥 FILTER BUDGET di JAVASCRIPT (lebih mudah dan pasti berfungsi)
    if (budget === 'under-500k') {
      allServices = allServices.filter(s => s.MIN_PRICE < 500000);
      console.log(`💰 After under-500k filter: ${allServices.length}`);
    } else if (budget === '500k-2m') {
      allServices = allServices.filter(s => s.MIN_PRICE >= 500000 && s.MIN_PRICE <= 2000000);
      console.log(`💰 After 500k-2m filter: ${allServices.length}`);
    } else if (budget === 'above-2m') {
      allServices = allServices.filter(s => s.MIN_PRICE > 2000000);
      console.log(`💰 After above-2m filter: ${allServices.length}`);
    }
    
    // 🔥 FILTER DELIVERY di JAVASCRIPT
    if (delivery === '24h') {
      // Kita perlu ambil min delivery days juga
      for (const service of allServices) {
        const pkg = await connection.execute(
          `SELECT MIN(delivery_days) as min_delivery FROM SERVICE_PACKAGES WHERE service_id = :sid`,
          { sid: service.SERVICE_ID }
        );
        service.MIN_DELIVERY = pkg.rows[0]?.MIN_DELIVERY || 999;
      }
      allServices = allServices.filter(s => s.MIN_DELIVERY <= 1);
      console.log(`📦 After 24h delivery filter: ${allServices.length}`);
    } else if (delivery === '3d') {
      for (const service of allServices) {
        const pkg = await connection.execute(
          `SELECT MIN(delivery_days) as min_delivery FROM SERVICE_PACKAGES WHERE service_id = :sid`,
          { sid: service.SERVICE_ID }
        );
        service.MIN_DELIVERY = pkg.rows[0]?.MIN_DELIVERY || 999;
      }
      allServices = allServices.filter(s => s.MIN_DELIVERY <= 3);
      console.log(`📦 After 3d delivery filter: ${allServices.length}`);
    } else if (delivery === '7d') {
      for (const service of allServices) {
        const pkg = await connection.execute(
          `SELECT MIN(delivery_days) as min_delivery FROM SERVICE_PACKAGES WHERE service_id = :sid`,
          { sid: service.SERVICE_ID }
        );
        service.MIN_DELIVERY = pkg.rows[0]?.MIN_DELIVERY || 999;
      }
      allServices = allServices.filter(s => s.MIN_DELIVERY <= 7);
      console.log(`📦 After 7d delivery filter: ${allServices.length}`);
    }
    
    // 🔥 SORTING di JAVASCRIPT
    if (sort === 'popular') {
      allServices.sort((a, b) => (b.TOTAL_ORDERS || 0) - (a.TOTAL_ORDERS || 0));
    } else if (sort === 'rating') {
      allServices.sort((a, b) => (b.SELLER_RATING || 0) - (a.SELLER_RATING || 0));
    } else if (sort === 'price-low') {
      allServices.sort((a, b) => (a.MIN_PRICE || 0) - (b.MIN_PRICE || 0));
    } else if (sort === 'price-high') {
      allServices.sort((a, b) => (b.MIN_PRICE || 0) - (a.MIN_PRICE || 0));
    } else if (sort === 'newest') {
      allServices.sort((a, b) => new Date(b.CREATED_AT) - new Date(a.CREATED_AT));
    }
    
    // 🔥 PAGINATION
    const total = allServices.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedServices = allServices.slice(start, end);
    
    // Get packages for each service
    for (const service of paginatedServices) {
      const pkgResult = await connection.execute(
        `SELECT package_id, package_name, description, price, delivery_days, revisions 
         FROM SERVICE_PACKAGES 
         WHERE service_id = :service_id
         ORDER BY price ASC`,
        { service_id: service.SERVICE_ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      service.PACKAGES = JSON.parse(JSON.stringify(pkgResult.rows));
    }
    
    res.json({
      success: true,
      data: paginatedServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error('GET SERVICES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET SERVICE BY ID =================
exports.getServiceById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const serviceId = parseInt(id);
    
    if (isNaN(serviceId)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }
    
    connection = await getConnection();
    
    // ========================================
    // 1. AMBIL DATA SERVICE DASAR
    // ========================================
    const result = await connection.execute(
      `SELECT s.service_id, s.freelancer_id, s.category_id, s.title, s.description,
              s.thumbnail_url, s.status, s.total_orders, s.created_at,
              s.image_1, s.image_2, s.image_3,
              c.name as category_name, c.slug as category_slug
       FROM SERVICES s
       JOIN CATEGORIES c ON s.category_id = c.category_id
       WHERE s.service_id = :id AND s.status = 'active'`,
      [serviceId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
    }
    
    const service = result.rows[0];
    
    // ========================================
    // 2. AMBIL DATA SELLER (FREELANCER)
    // ========================================
    const sellerResult = await connection.execute(
      `SELECT u.user_id, u.username, u.full_name, u.avatar_url, u.created_at,
              fp.bio, fp.rating_avg, fp.total_orders, fp.freelancer_level
       FROM FREELANCER_PROFILES fp
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE fp.freelancer_id = :freelancerId`,
      [service.FREELANCER_ID],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (sellerResult.rows.length > 0) {
      const seller = sellerResult.rows[0];
      service.SELLER_ID = seller.USER_ID;
      service.USERNAME = seller.USERNAME;
      service.SELLER_NAME = seller.FULL_NAME;
      service.SELLER_AVATAR = seller.AVATAR_URL;
      service.SELLER_BIO = seller.BIO;
      service.SELLER_RATING = seller.RATING_AVG;
      service.SELLER_ORDERS = seller.TOTAL_ORDERS;
      service.FREELANCER_LEVEL = seller.FREELANCER_LEVEL;
      service.SELLER_JOINED = seller.CREATED_AT;
    }
    
    // ========================================
    // 3. AMBIL PACKAGES
    // ========================================
    const pkgResult = await connection.execute(
      `SELECT package_id, package_name, description, price, delivery_days, revisions 
       FROM SERVICE_PACKAGES 
       WHERE service_id = :service_id
       ORDER BY 
         CASE package_name 
           WHEN 'basic' THEN 1 
           WHEN 'standard' THEN 2 
           WHEN 'premium' THEN 3 
         END`,
      [serviceId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    service.PACKAGES = pkgResult.rows;
    
    // ========================================
    // 4. GALLERY dari image_1, image_2, image_3
    // ========================================
    const gallery = [];
    if (service.IMAGE_1) gallery.push(service.IMAGE_1);
    if (service.IMAGE_2) gallery.push(service.IMAGE_2);
    if (service.IMAGE_3) gallery.push(service.IMAGE_3);
    service.GALLERY = gallery;
    
    // ========================================
    // 5. REVIEWS (sederhana, tanpa OFFSET FETCH)
    // ========================================
    const reviewResult = await connection.execute(
      `SELECT r.review_id, r.order_id, r.rating, r.review_comment, r.created_at,
              u.full_name, u.avatar_url
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       JOIN USERS u ON r.reviewer_id = u.user_id
       WHERE sp.service_id = :service_id AND r.review_comment IS NOT NULL
       ORDER BY r.created_at DESC`,
      [serviceId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    service.REVIEWS = reviewResult.rows.slice(0, 10);
    
    // ========================================
    // 6. REVIEW STATS
    // ========================================
    const reviewStats = await connection.execute(
      `SELECT 
         COUNT(*) as total_reviews,
         NVL(AVG(rating), 0) as avg_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
       FROM REVIEWS r
       JOIN ORDERS o ON r.order_id = o.order_id
       JOIN SERVICE_PACKAGES sp ON o.package_id = sp.package_id
       WHERE sp.service_id = :service_id`,
      [serviceId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    service.REVIEW_STATS = reviewStats.rows[0] || { total_reviews: 0, avg_rating: 0 };
    
    res.json({ success: true, data: service });
    
  } catch (err) {
    console.error('GET SERVICE BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
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
// ================= GET PACKAGE BY ID =================
exports.getPackageById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT sp.*, s.service_id, s.title as service_title, s.thumbnail_url,
              u.full_name as freelancer_name
       FROM SERVICE_PACKAGES sp
       JOIN SERVICES s ON sp.service_id = s.service_id
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE sp.package_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    }
    
    res.json({ success: true, data: result.rows[0] });
    
  } catch (err) {
    console.error('GET PACKAGE BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

exports.getMyServices = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    console.log('🔍 userId dari token:', userId);
    
    const userIdNum = parseInt(userId);
    console.log('🔍 userIdNum:', userIdNum);
    
    if (isNaN(userIdNum)) {
      return res.status(400).json({ success: false, message: 'User ID tidak valid' });
    }
    
    connection = await getConnection();
    
    // Get freelancer_id
    const freelancerResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      [userIdNum],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log('🔍 freelancerResult:', freelancerResult.rows);
    
    if (freelancerResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Anda bukan freelancer' });
    }
    
    const freelancerId = freelancerResult.rows[0].FREELANCER_ID;
    const freelancerIdNum = parseInt(freelancerId);
    console.log('🔍 freelancerIdNum:', freelancerIdNum);
    
    // 🔥 Coba query tanpa JOIN CATEGORIES dulu
    const result = await connection.execute(
      `SELECT service_id, freelancer_id, category_id, title, description,
              thumbnail_url, status, total_orders, created_at
       FROM SERVICES 
       WHERE freelancer_id = :freelancerId
       ORDER BY created_at DESC`,
      [freelancerIdNum],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log('🔍 result.rows.length:', result.rows.length);
    
    const services = result.rows;
    
    // Ambil packages
    for (const service of services) {
      console.log('🔍 Ambil packages untuk service_id:', service.SERVICE_ID);
      
      const pkgResult = await connection.execute(
        `SELECT package_id, package_name, description, price, delivery_days, revisions 
         FROM SERVICE_PACKAGES 
         WHERE service_id = :service_id
         ORDER BY price ASC`,
        [service.SERVICE_ID],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      console.log('🔍 packages ditemukan:', pkgResult.rows.length);
      
      service.PACKAGES = pkgResult.rows.map(pkg => ({
        ...pkg,
        PRICE: Number(pkg.PRICE),
        DELIVERY_DAYS: Number(pkg.DELIVERY_DAYS),
        REVISIONS: Number(pkg.REVISIONS)
      }));
      
      if (service.PACKAGES.length > 0) {
        service.MIN_PRICE = Math.min(...service.PACKAGES.map(p => p.PRICE));
      } else {
        service.MIN_PRICE = 0;
      }
    }
    
    res.json({
      success: true,
      data: services
    });
    
  } catch (err) {
    console.error('GET MY SERVICES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= EDIT SERVICE (Freelancer) - TANPA DELETE PACKAGES =================
exports.editService = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { 
      category_id, title, description, thumbnail_url, 
      packages, gallery, status 
    } = req.body;
    const userId = req.user.user_id;
    
    console.log('🔥 EDIT SERVICE CALLED');
    console.log('Service ID:', id);
    console.log('Gallery received:', gallery);
    console.log('Packages received:', packages?.length);
    
    // Validasi
    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul layanan wajib diisi' });
    }
    
    connection = await getConnection();
    
    // Cek kepemilikan
    const checkResult = await connection.execute(
      `SELECT s.service_id 
       FROM SERVICES s
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE s.service_id = :id AND fp.user_id = :userId`,
      { id: parseInt(id), userId: parseInt(userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // ================= UPDATE GALLERY =================
    let img1 = null;
    let img2 = null;
    let img3 = null;
    
    if (gallery && Array.isArray(gallery)) {
      img1 = gallery[0] || null;
      img2 = gallery[1] || null;
      img3 = gallery[2] || null;
    }
    
    console.log('Saving gallery:', { img1, img2, img3 });
    
    // ================= UPDATE SERVICE =================
    await connection.execute(
      `UPDATE SERVICES 
       SET category_id = :category_id,
           title = :title,
           description = :description,
           thumbnail_url = :thumbnail_url,
           status = :status,
           image_1 = :img1,
           image_2 = :img2,
           image_3 = :img3
       WHERE service_id = :id`,
      { 
        category_id: category_id ? parseInt(category_id) : null,
        title: title,
        description: description || null,
        thumbnail_url: thumbnail_url || null,
        status: status || 'active',
        img1: img1,
        img2: img2,
        img3: img3,
        id: parseInt(id)
      }
    );
    
    // ================= UPDATE PACKAGES (TANPA DELETE) =================
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        // Cek apakah package sudah ada
        const checkPkg = await connection.execute(
          `SELECT package_id FROM SERVICE_PACKAGES 
           WHERE service_id = :service_id AND package_name = :package_name`,
          {
            service_id: parseInt(id),
            package_name: pkg.package_name
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (checkPkg.rows.length > 0) {
          // UPDATE package yang sudah ada
          await connection.execute(
            `UPDATE SERVICE_PACKAGES 
             SET description = :description,
                 price = :price,
                 delivery_days = :delivery_days,
                 revisions = :revisions
             WHERE service_id = :service_id AND package_name = :package_name`,
            {
              description: pkg.description || null,
              price: parseInt(pkg.price),
              delivery_days: parseInt(pkg.delivery_days),
              revisions: pkg.revisions ? parseInt(pkg.revisions) : 2,
              service_id: parseInt(id),
              package_name: pkg.package_name
            }
          );
          console.log(`✅ Updated package: ${pkg.package_name}`);
        } else {
          // INSERT package baru jika belum ada
          await connection.execute(
            `INSERT INTO SERVICE_PACKAGES 
             (service_id, package_name, description, price, delivery_days, revisions)
             VALUES (:service_id, :package_name, :description, :price, :delivery_days, :revisions)`,
            {
              service_id: parseInt(id),
              package_name: pkg.package_name,
              description: pkg.description || null,
              price: parseInt(pkg.price),
              delivery_days: parseInt(pkg.delivery_days),
              revisions: pkg.revisions ? parseInt(pkg.revisions) : 2
            }
          );
          console.log(`✅ Inserted new package: ${pkg.package_name}`);
        }
      }
    }
    
    await connection.commit();
    
    // ================= VERIFIKASI =================
    const verifyResult = await connection.execute(
      `SELECT IMAGE_1, IMAGE_2, IMAGE_3 FROM SERVICES WHERE SERVICE_ID = :id`,
      { id: parseInt(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('✅ Verifikasi setelah update:', verifyResult.rows[0]);
    
    res.json({ 
      success: true, 
      message: 'Service berhasil diupdate' 
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('EDIT SERVICE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPLOAD THUMBNAIL SERVICE =================
exports.uploadServiceThumbnail = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }
    
    const imageUrl = `/uploads/services/${req.file.filename}`;
    console.log('✅ File uploaded:', req.file.filename);
    console.log('📎 Image URL:', imageUrl);
    
    res.json({
      success: true,
      data: { url: imageUrl, filename: req.file.filename }
    });
  } catch (err) {
    console.error('UPLOAD THUMBNAIL ERROR:', err);
    res.status(500).json({ success: false, message: 'Upload gagal' });
  }
};

// ================= UPLOAD GALLERY SERVICE =================
exports.uploadServiceGallery = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }
    
    const images = req.files.map(file => ({
      url: `/uploads/services/${file.filename}`,
      filename: file.filename
    }));
    
    console.log('✅ Gallery uploaded:', images.length, 'files');
    console.log('📎 URLs:', images.map(i => i.url));
    
    res.json({
      success: true,
      data: images
    });
  } catch (err) {
    console.error('UPLOAD GALLERY ERROR:', err);
    res.status(500).json({ success: false, message: 'Upload gagal' });
  }
};