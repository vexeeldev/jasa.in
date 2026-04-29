const { getConnection } = require('../config/db');

// ================= GET ALL PORTFOLIOS BY FREELANCER =================
exports.getPortfoliosByFreelancer = async (req, res) => {
  let connection;
  try {
    const { freelancerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    connection = await getConnection();
    
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT p.portfolio_id, p.freelancer_id, p.title, p.description, 
              p.image_url, p.project_url, p.created_at,
              u.full_name as freelancer_name, u.username
       FROM PORTFOLIOS p
       JOIN FREELANCER_PROFILES fp ON p.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE p.freelancer_id = :freelancerId
       ORDER BY p.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { freelancerId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM PORTFOLIOS WHERE freelancer_id = :freelancerId`,
      { freelancerId }
    );
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
    console.error('GET PORTFOLIOS BY FREELANCER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET PORTFOLIO BY ID =================
exports.getPortfolioById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT p.portfolio_id, p.freelancer_id, p.title, p.description, 
              p.image_url, p.project_url, p.created_at,
              u.full_name as freelancer_name, u.username, u.avatar_url,
              fp.rating_avg, fp.freelancer_level
       FROM PORTFOLIOS p
       JOIN FREELANCER_PROFILES fp ON p.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE p.portfolio_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio tidak ditemukan' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (err) {
    console.error('GET PORTFOLIO BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE PORTFOLIO (Freelancer) =================
exports.createPortfolio = async (req, res) => {
  let connection;
  try {
    const { title, description, image_url, project_url } = req.body;
    const userId = req.user.user_id;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Judul portfolio wajib diisi' 
      });
    }
    
    connection = await getConnection();
    
    // Get freelancer_id from user_id
    const freelancerResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId }
    );
    
    if (freelancerResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Anda bukan freelancer' 
      });
    }
    
    const freelancerId = freelancerResult.rows[0].FREELANCER_ID;
    
    const result = await connection.execute(
      `INSERT INTO PORTFOLIOS (freelancer_id, title, description, image_url, project_url)
       VALUES (:freelancerId, :title, :description, :image_url, :project_url)
       RETURNING portfolio_id INTO :portfolio_id`,
      {
        freelancerId,
        title,
        description: description || null,
        image_url: image_url || null,
        project_url: project_url || null,
        portfolio_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const portfolioId = result.outBinds.portfolio_id[0];
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Portfolio berhasil ditambahkan',
      data: { portfolio_id: portfolioId }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CREATE PORTFOLIO ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE PORTFOLIO =================
exports.updatePortfolio = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, description, image_url, project_url } = req.body;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Check ownership
    const checkResult = await connection.execute(
      `SELECT p.portfolio_id
       FROM PORTFOLIOS p
       JOIN FREELANCER_PROFILES fp ON p.freelancer_id = fp.freelancer_id
       WHERE p.portfolio_id = :id AND fp.user_id = :userId`,
      { id, userId }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tidak memiliki akses' 
      });
    }
    
    await connection.execute(
      `UPDATE PORTFOLIOS 
       SET title = COALESCE(:title, title),
           description = COALESCE(:description, description),
           image_url = COALESCE(:image_url, image_url),
           project_url = COALESCE(:project_url, project_url)
       WHERE portfolio_id = :id`,
      { title, description, image_url, project_url, id }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Portfolio berhasil diupdate'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE PORTFOLIO ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE PORTFOLIO =================
exports.deletePortfolio = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const role = req.user.role;
    
    connection = await getConnection();
    
    let sql = `DELETE FROM PORTFOLIOS WHERE portfolio_id = :id`;
    const params = { id };
    
    if (role !== 'admin') {
      sql += ` AND freelancer_id = (SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId)`;
      params.userId = userId;
    }
    
    const result = await connection.execute(sql, params);
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio tidak ditemukan' 
      });
    }
    
    res.json({
      success: true,
      message: 'Portfolio berhasil dihapus'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELETE PORTFOLIO ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET MY PORTFOLIOS (Freelancer login) =================
exports.getMyPortfolios = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;
    
    connection = await getConnection();
    
    // Get freelancer_id from user_id
    const freelancerResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId }
    );
    
    if (freelancerResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Anda bukan freelancer'
      });
    }
    
    const freelancerId = freelancerResult.rows[0].FREELANCER_ID;
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT p.portfolio_id, p.freelancer_id, p.title, p.description, 
              p.image_url, p.project_url, p.created_at
       FROM PORTFOLIOS p
       WHERE p.freelancer_id = :freelancerId
       ORDER BY p.created_at DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { freelancerId, offset, limit },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Get total count
    const countResult = await connection.execute(
      `SELECT COUNT(*) as total FROM PORTFOLIOS WHERE freelancer_id = :freelancerId`,
      { freelancerId }
    );
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
    console.error('GET MY PORTFOLIOS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET RECENT PORTFOLIOS (Homepage) =================
exports.getRecentPortfolios = async (req, res) => {
  let connection;
  try {
    const { limit = 10 } = req.query;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT p.portfolio_id, p.freelancer_id, p.title, p.image_url, p.created_at,
              u.full_name as freelancer_name, u.username, u.avatar_url,
              fp.rating_avg, fp.freelancer_level
       FROM PORTFOLIOS p
       JOIN FREELANCER_PROFILES fp ON p.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       ORDER BY p.created_at DESC
       FETCH FIRST :limit ROWS ONLY`,
      { limit: parseInt(limit) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('GET RECENT PORTFOLIOS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPLOAD PORTFOLIO IMAGE =================
exports.uploadPortfolioImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File gambar tidak ditemukan' 
      });
    }
    
    const imageUrl = `/uploads/portfolios/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Gambar berhasil diupload',
      data: { image_url: imageUrl }
    });
    
  } catch (err) {
    console.error('UPLOAD PORTFOLIO IMAGE ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};