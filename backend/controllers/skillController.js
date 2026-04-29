const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// ================= GET ALL SKILLS =================
exports.getAllSkills = async (req, res) => {
  let connection;
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    
    connection = await getConnection();
    
    let sql = `
      SELECT s.skill_id, s.name, s.category,
             (SELECT COUNT(*) FROM FREELANCER_SKILLS fs WHERE fs.skill_id = s.skill_id) as freelancers_count
      FROM SKILLS s
      WHERE 1=1
    `;
    
    const params = {};
    
    if (category) {
      sql += ` AND s.category = :category`;
      params.category = category;
    }
    
    if (search) {
      sql += ` AND LOWER(s.name) LIKE LOWER(:search)`;
      params.search = `%${search}%`;
    }
    
    sql += ` ORDER BY s.name ASC`;
    
    const offset = (page - 1) * limit;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;
    
    const result = await connection.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM SKILLS WHERE 1=1`;
    const countParams = {};
    
    if (category) {
      countSql += ` AND category = :category`;
      countParams.category = category;
    }
    
    if (search) {
      countSql += ` AND LOWER(name) LIKE LOWER(:search)`;
      countParams.search = `%${search}%`;
    }
    
    const countResult = await connection.execute(countSql, countParams);
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
    console.error('GET ALL SKILLS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET SKILL BY ID =================
exports.getSkillById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT s.skill_id, s.name, s.category,
              (SELECT COUNT(*) FROM FREELANCER_SKILLS fs WHERE fs.skill_id = s.skill_id) as freelancers_count
       FROM SKILLS s
       WHERE s.skill_id = :id`,
      { id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill tidak ditemukan' 
      });
    }
    
    // Get freelancers with this skill
    const freelancersResult = await connection.execute(
      `SELECT fp.freelancer_id, u.user_id, u.full_name, u.username, u.avatar_url,
              fp.rating_avg, fp.freelancer_level, fp.total_orders
       FROM FREELANCER_SKILLS fs
       JOIN FREELANCER_PROFILES fp ON fs.freelancer_id = fp.freelancer_id
       JOIN USERS u ON fp.user_id = u.user_id
       WHERE fs.skill_id = :skillId
       ORDER BY fp.rating_avg DESC
       FETCH FIRST 10 ROWS ONLY`,
      { skillId: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const skill = result.rows[0];
    skill.FREELANCERS = freelancersResult.rows;
    
    res.json({
      success: true,
      data: skill
    });
    
  } catch (err) {
    console.error('GET SKILL BY ID ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET SKILLS BY FREELANCER =================
exports.getSkillsByFreelancer = async (req, res) => {
  let connection;
  try {
    const { freelancerId } = req.params;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT s.skill_id, s.name, s.category
       FROM SKILLS s
       JOIN FREELANCER_SKILLS fs ON s.skill_id = fs.skill_id
       WHERE fs.freelancer_id = :freelancerId
       ORDER BY s.name ASC`,
      { freelancerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('GET SKILLS BY FREELANCER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET MY SKILLS (Freelancer login) =================
exports.getMySkills = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
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
    
    const result = await connection.execute(
      `SELECT s.skill_id, s.name, s.category
       FROM SKILLS s
       JOIN FREELANCER_SKILLS fs ON s.skill_id = fs.skill_id
       WHERE fs.freelancer_id = :freelancerId
       ORDER BY s.name ASC`,
      { freelancerId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('GET MY SKILLS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= CREATE SKILL (Admin only) =================
exports.createSkill = async (req, res) => {
  let connection;
  try {
    const { name, category } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama skill wajib diisi' 
      });
    }
    
    connection = await getConnection();
    
    // Check if skill already exists
    const checkResult = await connection.execute(
      `SELECT skill_id FROM SKILLS WHERE LOWER(name) = LOWER(:name)`,
      { name }
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill sudah ada' 
      });
    }
    
    const result = await connection.execute(
      `INSERT INTO SKILLS (name, category)
       VALUES (:name, :category)
       RETURNING skill_id INTO :skill_id`,
      {
        name,
        category: category || null,
        skill_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    const skillId = result.outBinds.skill_id[0];
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Skill berhasil ditambahkan',
      data: { skill_id: skillId }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('CREATE SKILL ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= UPDATE SKILL (Admin only) =================
exports.updateSkill = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    
    connection = await getConnection();
    
    // Check if skill exists
    const checkResult = await connection.execute(
      `SELECT skill_id FROM SKILLS WHERE skill_id = :id`,
      { id }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill tidak ditemukan' 
      });
    }
    
    // Check if name already exists (excluding current)
    if (name) {
      const nameCheck = await connection.execute(
        `SELECT skill_id FROM SKILLS WHERE LOWER(name) = LOWER(:name) AND skill_id != :id`,
        { name, id }
      );
      
      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Skill dengan nama tersebut sudah ada' 
        });
      }
    }
    
    await connection.execute(
      `UPDATE SKILLS 
       SET name = COALESCE(:name, name),
           category = COALESCE(:category, category)
       WHERE skill_id = :id`,
      { name, category, id }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Skill berhasil diupdate'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('UPDATE SKILL ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= DELETE SKILL (Admin only) =================
exports.deleteSkill = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await getConnection();
    
    // Check if skill exists
    const checkResult = await connection.execute(
      `SELECT skill_id FROM SKILLS WHERE skill_id = :id`,
      { id }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill tidak ditemukan' 
      });
    }
    
    // This will cascade delete from FREELANCER_SKILLS
    await connection.execute(`DELETE FROM SKILLS WHERE skill_id = :id`, { id });
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Skill berhasil dihapus'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('DELETE SKILL ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= ADD SKILL TO FREELANCER =================
exports.addSkillToFreelancer = async (req, res) => {
  let connection;
  try {
    const { skill_id } = req.body;
    const userId = req.user.user_id;
    
    if (!skill_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill ID wajib diisi' 
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
    
    // Check if skill exists
    const skillCheck = await connection.execute(
      `SELECT skill_id FROM SKILLS WHERE skill_id = :skill_id`,
      { skill_id }
    );
    
    if (skillCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill tidak ditemukan' 
      });
    }
    
    // Check if already added
    const existingCheck = await connection.execute(
      `SELECT * FROM FREELANCER_SKILLS 
       WHERE freelancer_id = :freelancerId AND skill_id = :skill_id`,
      { freelancerId, skill_id }
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill sudah ditambahkan' 
      });
    }
    
    await connection.execute(
      `INSERT INTO FREELANCER_SKILLS (freelancer_id, skill_id)
       VALUES (:freelancerId, :skill_id)`,
      { freelancerId, skill_id }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Skill berhasil ditambahkan ke profil'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('ADD SKILL TO FREELANCER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= REMOVE SKILL FROM FREELANCER =================
exports.removeSkillFromFreelancer = async (req, res) => {
  let connection;
  try {
    const { skillId } = req.params;
    const userId = req.user.user_id;
    
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
      `DELETE FROM FREELANCER_SKILLS 
       WHERE freelancer_id = :freelancerId AND skill_id = :skillId`,
      { freelancerId, skillId }
    );
    
    await connection.commit();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill tidak ditemukan pada profil' 
      });
    }
    
    res.json({
      success: true,
      message: 'Skill berhasil dihapus dari profil'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('REMOVE SKILL FROM FREELANCER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= BULK ADD SKILLS TO FREELANCER =================
exports.bulkAddSkills = async (req, res) => {
  let connection;
  try {
    const { skill_ids } = req.body;
    const userId = req.user.user_id;
    
    if (!skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Skill IDs harus berupa array' 
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
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const skillId of skill_ids) {
      // Check if skill exists
      const skillCheck = await connection.execute(
        `SELECT skill_id FROM SKILLS WHERE skill_id = :skillId`,
        { skillId }
      );
      
      if (skillCheck.rows.length === 0) {
        skippedCount++;
        continue;
      }
      
      // Check if already added
      const existingCheck = await connection.execute(
        `SELECT * FROM FREELANCER_SKILLS 
         WHERE freelancer_id = :freelancerId AND skill_id = :skillId`,
        { freelancerId, skillId }
      );
      
      if (existingCheck.rows.length > 0) {
        skippedCount++;
        continue;
      }
      
      await connection.execute(
        `INSERT INTO FREELANCER_SKILLS (freelancer_id, skill_id)
         VALUES (:freelancerId, :skillId)`,
        { freelancerId, skillId }
      );
      addedCount++;
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `${addedCount} skill berhasil ditambahkan, ${skippedCount} skill dilewati`,
      data: {
        added: addedCount,
        skipped: skippedCount
      }
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('BULK ADD SKILLS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET SKILL CATEGORIES =================
exports.getSkillCategories = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT DISTINCT category 
       FROM SKILLS 
       WHERE category IS NOT NULL 
       ORDER BY category ASC`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const categories = result.rows.map(row => row.CATEGORY);
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (err) {
    console.error('GET SKILL CATEGORIES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET POPULAR SKILLS =================
exports.getPopularSkills = async (req, res) => {
  let connection;
  try {
    const { limit = 20 } = req.query;
    
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT s.skill_id, s.name, s.category,
              COUNT(fs.freelancer_id) as freelancers_count
       FROM SKILLS s
       JOIN FREELANCER_SKILLS fs ON s.skill_id = fs.skill_id
       GROUP BY s.skill_id, s.name, s.category
       ORDER BY freelancers_count DESC
       FETCH FIRST :limit ROWS ONLY`,
      { limit: parseInt(limit) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('GET POPULAR SKILLS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};