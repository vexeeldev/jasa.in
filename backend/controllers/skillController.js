const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// ================= GET MY SKILLS =================
exports.getMySkills = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Ambil freelancer_id
    const fpResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (fpResult.rows.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    const freelancerId = fpResult.rows[0].FREELANCER_ID;
    
    const result = await connection.execute(
      `SELECT s.skill_id, s.name, s.category
       FROM SKILLS s
       INNER JOIN FREELANCER_SKILLS fs ON s.skill_id = fs.skill_id
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
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= ADD SKILL =================
exports.addSkill = async (req, res) => {
  let connection;
  try {
    const { skill_name } = req.body;
    const userId = req.user.user_id;
    
    if (!skill_name || !skill_name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama skill wajib diisi' });
    }
    
    connection = await getConnection();
    
    // Ambil freelancer_id
    const fpResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (fpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Anda bukan freelancer' });
    }
    
    const freelancerId = fpResult.rows[0].FREELANCER_ID;
    
    // Cek apakah skill sudah ada di tabel SKILLS
    let skillId;
    const existingSkill = await connection.execute(
      `SELECT skill_id FROM SKILLS WHERE LOWER(name) = LOWER(:name)`,
      { name: skill_name.trim() },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (existingSkill.rows.length > 0) {
      skillId = existingSkill.rows[0].SKILL_ID;
    } else {
      // Insert skill baru ke SKILLS
      const newSkill = await connection.execute(
        `INSERT INTO SKILLS (name, category) VALUES (:name, :category) RETURNING skill_id INTO :skill_id`,
        { 
          name: skill_name.trim(),
          category: 'General',
          skill_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      skillId = newSkill.outBinds.skill_id[0];
    }
    
    // Cek apakah sudah terhubung di FREELANCER_SKILLS
    const existingLink = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_SKILLS 
       WHERE freelancer_id = :freelancerId AND skill_id = :skillId`,
      { freelancerId, skillId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (existingLink.rows.length === 0) {
      await connection.execute(
        `INSERT INTO FREELANCER_SKILLS (freelancer_id, skill_id)
         VALUES (:freelancerId, :skillId)`,
        { freelancerId, skillId }
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Skill berhasil ditambahkan'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('ADD SKILL ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= REMOVE SKILL =================
exports.removeSkill = async (req, res) => {
  let connection;
  try {
    const { skillId } = req.params;
    const userId = req.user.user_id;
    
    connection = await getConnection();
    
    // Ambil freelancer_id
    const fpResult = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (fpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Anda bukan freelancer' });
    }
    
    const freelancerId = fpResult.rows[0].FREELANCER_ID;
    
    // Hapus relasi dari FREELANCER_SKILLS
    await connection.execute(
      `DELETE FROM FREELANCER_SKILLS 
       WHERE freelancer_id = :freelancerId AND skill_id = :skillId`,
      { freelancerId, skillId }
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Skill berhasil dihapus'
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('REMOVE SKILL ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};