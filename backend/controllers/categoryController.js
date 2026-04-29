const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// ================= GET ALL CATEGORIES =================
exports.getAllCategories = async (req, res) => {
  let connection;
  try {
    const { parent_id, include_subcategories = 'true' } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT c.category_id, c.parent_id, c.name, c.slug, c.icon_url,
             (SELECT COUNT(*) FROM CATEGORIES WHERE parent_id = c.category_id) as subcategories_count,
             (SELECT COUNT(*) FROM SERVICES s 
              JOIN SERVICE_PACKAGES sp ON s.service_id = sp.service_id
              WHERE s.category_id = c.category_id) as services_count
      FROM CATEGORIES c
      WHERE 1=1
    `;
    
    const params = {};
    
    if (parent_id === 'null') {
      sql += ` AND c.parent_id IS NULL`;
    } else if (parent_id) {
      sql += ` AND c.parent_id = :parent_id`;
      params.parent_id = parent_id;
    }
    
    sql += ` ORDER BY c.name ASC`;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // If include_subcategories is true, get subcategories for each parent
    if (include_subcategories === 'true') {
      for (const category of result.rows) {
        if (category.SUBCATEGORIES_COUNT > 0) {
          const subResult = await connection.execute(
            `SELECT category_id, name, slug, icon_url
             FROM CATEGORIES
             WHERE parent_id = :parent_id
             ORDER BY name ASC`,
            { parent_id: category.CATEGORY_ID },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          category.SUBCATEGORIES = subResult.rows;
        }
      }
    }
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
    
  } catch (err) {
    console.error('GET ALL CATEGORIES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET CATEGORY BY ID =================
exports.getCategoryById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT c.*,
              (SELECT name FROM CATEGORIES WHERE category_id = c.parent_id) as parent_name,
              (SELECT COUNT(*) FROM CATEGORIES WHERE parent_id = c.category_id) as subcategories_count,
              (SELECT COUNT(*) FROM SERVICES s 
               JOIN SERVICE_PACKAGES sp ON s.service_id = sp.service_id
               WHERE s.category_id = c.category_id) as services_count
       FROM CATEGORIES c
       WHERE c.category_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    
    const category = result.rows[0];
    
    // Get subcategories
    const subResult = await connection.execute(
      `SELECT category_id, name, slug, icon_url
       FROM CATEGORIES
       WHERE parent_id = :parent_id
       ORDER BY name ASC`,
      { parent_id: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    category.SUBCATEGORIES = subResult.rows;
    
    res.json({ success: true, data: category });
    
  } catch (err) {
    console.error('GET CATEGORY BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET CATEGORY BY SLUG =================
exports.getCategoryBySlug = async (req, res) => {
  let connection;
  try {
    const { slug } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT c.*,
              (SELECT name FROM CATEGORIES WHERE category_id = c.parent_id) as parent_name,
              (SELECT COUNT(*) FROM CATEGORIES WHERE parent_id = c.category_id) as subcategories_count
       FROM CATEGORIES c
       WHERE c.slug = :slug`,
      { slug },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    
    const category = result.rows[0];
    
    // Get subcategories
    const subResult = await connection.execute(
      `SELECT category_id, name, slug, icon_url
       FROM CATEGORIES
       WHERE parent_id = :parent_id
       ORDER BY name ASC`,
      { parent_id: category.CATEGORY_ID },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    category.SUBCATEGORIES = subResult.rows;
    
    res.json({ success: true, data: category });
    
  } catch (err) {
    console.error('GET CATEGORY BY SLUG ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET CATEGORY TREE (Hierarchy) =================
exports.getCategoryTree = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    // Get all parent categories (parent_id IS NULL)
    const parentResult = await connection.execute(
      `SELECT category_id, name, slug, icon_url
       FROM CATEGORIES
       WHERE parent_id IS NULL
       ORDER BY name ASC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get subcategories for each parent
    for (const parent of parentResult.rows) {
      const subResult = await connection.execute(
        `SELECT category_id, name, slug, icon_url,
                (SELECT COUNT(*) FROM CATEGORIES WHERE parent_id = c.category_id) as has_children
         FROM CATEGORIES c
         WHERE parent_id = :parent_id
         ORDER BY name ASC`,
        { parent_id: parent.CATEGORY_ID },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      parent.SUBCATEGORIES = subResult.rows;
      
      // Get third level if exists
      for (const sub of parent.SUBCATEGORIES) {
        if (sub.HAS_CHILDREN > 0) {
          const thirdResult = await connection.execute(
            `SELECT category_id, name, slug, icon_url
             FROM CATEGORIES
             WHERE parent_id = :parent_id
             ORDER BY name ASC`,
            { parent_id: sub.CATEGORY_ID },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          sub.CHILDREN = thirdResult.rows;
        }
      }
    }
    
    res.json({
      success: true,
      data: parentResult.rows
    });
    
  } catch (err) {
    console.error('GET CATEGORY TREE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE CATEGORY (Admin only) =================
exports.createCategory = async (req, res) => {
  let connection;
  try {
    const { parent_id, name, slug, icon_url } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama dan slug kategori wajib diisi' 
      });
    }
    
    connection = await getConnection();
    
    // Check if slug already exists
    const slugCheck = await connection.execute(
      `SELECT category_id FROM CATEGORIES WHERE slug = :slug`,
      { slug }
    );
    
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug sudah digunakan' 
      });
    }
    
    // If parent_id is provided, check if parent exists
    if (parent_id) {
      const parentCheck = await connection.execute(
        `SELECT category_id FROM CATEGORIES WHERE category_id = :parent_id`,
        { parent_id }
      );
      
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent kategori tidak ditemukan' 
        });
      }
    }
    
    const result = await connection.execute(
      `INSERT INTO CATEGORIES (parent_id, name, slug, icon_url)
       VALUES (:parent_id, :name, :slug, :icon_url)
       RETURNING category_id INTO :category_id`,
      {
        parent_id: parent_id || null,
        name,
        slug,
        icon_url: icon_url || null,
        category_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const categoryId = result.outBinds.category_id[0];
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      data: { category_id: categoryId }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CREATE CATEGORY ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE CATEGORY (Admin only) =================
exports.updateCategory = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { parent_id, name, slug, icon_url } = req.body;
    
    connection = await getConnection();
    
    // Check if category exists
    const categoryCheck = await connection.execute(
      `SELECT * FROM CATEGORIES WHERE category_id = :id`,
      { id }
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kategori tidak ditemukan' 
      });
    }
    
    // Check if slug already exists (excluding current)
    if (slug) {
      const slugCheck = await connection.execute(
        `SELECT category_id FROM CATEGORIES WHERE slug = :slug AND category_id != :id`,
        { slug, id }
      );
      
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Slug sudah digunakan' 
        });
      }
    }
    
    // Cannot set parent_id to itself
    if (parent_id === parseInt(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kategori tidak bisa menjadi parent dari dirinya sendiri' 
      });
    }
    
    // Check if parent exists
    if (parent_id) {
      const parentCheck = await connection.execute(
        `SELECT category_id FROM CATEGORIES WHERE category_id = :parent_id`,
        { parent_id }
      );
      
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent kategori tidak ditemukan' 
        });
      }
    }
    
    await connection.execute(
      `UPDATE CATEGORIES 
       SET parent_id = COALESCE(:parent_id, parent_id),
           name = COALESCE(:name, name),
           slug = COALESCE(:slug, slug),
           icon_url = COALESCE(:icon_url, icon_url)
       WHERE category_id = :id`,
      {
        parent_id: parent_id || null,
        name,
        slug,
        icon_url,
        id
      }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Kategori berhasil diupdate'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE CATEGORY ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE CATEGORY (Admin only) =================
exports.deleteCategory = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    // Check if category exists
    const categoryCheck = await connection.execute(
      `SELECT * FROM CATEGORIES WHERE category_id = :id`,
      { id }
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kategori tidak ditemukan' 
      });
    }
    
    // Check if category has subcategories
    const subCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM CATEGORIES WHERE parent_id = :id`,
      { id }
    );
    
    if (subCheck.rows[0].COUNT > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kategori memiliki subkategori, hapus subkategori terlebih dahulu' 
      });
    }
    
    // Check if category has services
    const serviceCheck = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM SERVICES s
       JOIN SERVICE_PACKAGES sp ON s.service_id = sp.service_id
       WHERE s.category_id = :id`,
      { id }
    );
    
    if (serviceCheck.rows[0].COUNT > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kategori memiliki layanan, pindahkan atau hapus layanan terlebih dahulu' 
      });
    }
    
    await connection.execute(
      `DELETE FROM CATEGORIES WHERE category_id = :id`,
      { id }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELETE CATEGORY ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET POPULAR CATEGORIES =================
exports.getPopularCategories = async (req, res) => {
  let connection;
  try {
    const { limit = 8 } = req.query;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT c.category_id, c.name, c.slug, c.icon_url,
              COUNT(DISTINCT s.service_id) as services_count,
              COUNT(DISTINCT o.order_id) as orders_count
       FROM CATEGORIES c
       LEFT JOIN SERVICES s ON s.category_id = c.category_id
       LEFT JOIN SERVICE_PACKAGES sp ON s.service_id = sp.service_id
       LEFT JOIN ORDERS o ON sp.package_id = o.package_id
       WHERE c.parent_id IS NOT NULL
       GROUP BY c.category_id, c.name, c.slug, c.icon_url
       ORDER BY orders_count DESC, services_count DESC
       FETCH FIRST :limit ROWS ONLY`,
      { limit: parseInt(limit) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('GET POPULAR CATEGORIES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET CATEGORY HIERARCHY BREADCRUMB =================
exports.getCategoryBreadcrumb = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    // Recursive query to get category path
    const result = await connection.execute(
      `WITH RECURSIVE category_path AS (
         SELECT category_id, parent_id, name, slug, 0 as level
         FROM CATEGORIES
         WHERE category_id = :id
         UNION ALL
         SELECT c.category_id, c.parent_id, c.name, c.slug, cp.level + 1
         FROM CATEGORIES c
         JOIN category_path cp ON c.category_id = cp.parent_id
       )
       SELECT category_id, name, slug
       FROM category_path
       ORDER BY level DESC`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('GET CATEGORY BREADCRUMB ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};