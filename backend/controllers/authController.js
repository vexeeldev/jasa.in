const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'Platform_jasa.in';

// ================= LOGIN =================
exports.login = async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT u.user_id, u.username, u.email, u.password_hash,
              u.full_name, u.phone, u.avatar_url,
              u.role, u.balance, u.created_at,
              fp.freelancer_id, fp.freelancer_level, fp.rating_avg, fp.total_orders, fp.bio
       FROM USERS u
       LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
       WHERE u.email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const token = jwt.sign(
      {
        user_id: user.USER_ID,
        email: user.EMAIL,
        role: user.ROLE,
        freelancer_id: user.FREELANCER_ID
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.PASSWORD_HASH;

    res.json({
      success: true,
      message: 'Login berhasil',
      data: { token, user }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= REGISTER =================
exports.register = async (req, res) => {
  let connection;
  try {
    const { username, email, password, full_name, phone, role = 'klien' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, dan password wajib diisi'
      });
    }

    connection = await getConnection();

    // Check existing user
    const existingUser = await connection.execute(
      `SELECT user_id FROM USERS WHERE email = :email OR username = :username`,
      { email, username }
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email atau username sudah terdaftar'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalRole = role === 'freelancer' ? 'freelancer' : 'klien';

    const userResult = await connection.execute(
      `INSERT INTO USERS 
       (username, email, password_hash, full_name, phone, role)
       VALUES (:username, :email, :password_hash, :full_name, :phone, :role)
       RETURNING user_id INTO :out_user_id`,
      {
        username,
        email,
        password_hash: hashedPassword,
        full_name: full_name || null,
        phone: phone || null,
        role: finalRole,
        out_user_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const userId = userResult.outBinds.out_user_id[0];
    let freelancerId = null;

    if (finalRole === 'freelancer') {
      const fpResult = await connection.execute(
        `INSERT INTO FREELANCER_PROFILES (user_id, bio)
         VALUES (:user_id, :bio)
         RETURNING freelancer_id INTO :out_fid`,
        {
          user_id: userId,
          bio: req.body.bio || null,
          out_fid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );
      freelancerId = fpResult.outBinds.out_fid[0];
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Register berhasil',
      data: { user_id: userId, freelancer_id: freelancerId }
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= GET CURRENT USER =================
exports.getCurrentUser = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.phone,
              u.avatar_url, u.role, u.balance, u.created_at,
              fp.freelancer_id, fp.bio, fp.rating_avg, fp.total_orders, fp.freelancer_level
       FROM USERS u
       LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
       WHERE u.user_id = :id`,
      { id: req.user.user_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= LOGOUT =================
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  let connection;
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.user_id;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Password wajib diisi' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    connection = await getConnection();

    const userResult = await connection.execute(
      `SELECT password_hash FROM USERS WHERE user_id = :userId`,
      { userId }
    );

    const isValid = await bcrypt.compare(current_password, userResult.rows[0].PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Password saat ini salah' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await connection.execute(
      `UPDATE USERS SET password_hash = :hashedPassword WHERE user_id = :userId`,
      { hashedPassword, userId }
    );

    await connection.commit();

    res.json({ success: true, message: 'Password berhasil diubah' });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= BECOME FREELANCER =================
exports.becomeFreelancer = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;
    const { bio, skills } = req.body;

    connection = await getConnection();

    const check = await connection.execute(
      `SELECT freelancer_id FROM FREELANCER_PROFILES WHERE user_id = :userId`,
      { userId }
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah menjadi freelancer'
      });
    }

    // Update role user
    await connection.execute(
      `UPDATE USERS SET role = 'freelancer' WHERE user_id = :userId`,
      { userId }
    );

    const fpResult = await connection.execute(
      `INSERT INTO FREELANCER_PROFILES (user_id, bio)
       VALUES (:userId, :bio)
       RETURNING freelancer_id INTO :fid`,
      {
        userId,
        bio: bio || null,
        fid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const freelancerId = fpResult.outBinds.fid[0];

    // Add skills if provided
    if (skills && skills.length > 0) {
      for (const skillName of skills) {
        const skillRes = await connection.execute(
          `SELECT skill_id FROM SKILLS WHERE LOWER(name) = LOWER(:name)`,
          { name: skillName }
        );
        
        if (skillRes.rows.length > 0) {
          await connection.execute(
            `INSERT INTO FREELANCER_SKILLS (freelancer_id, skill_id)
             VALUES (:fid, :sid)`,
            { fid: freelancerId, sid: skillRes.rows[0].SKILL_ID }
          );
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Berhasil upgrade menjadi freelancer',
      data: { freelancer_id: freelancerId }
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= FORGOT PASSWORD (Request OTP) =================
exports.forgotPassword = async (req, res) => {
  let connection;
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email wajib diisi' });
    }

    connection = await getConnection();

    const userResult = await connection.execute(
      `SELECT user_id FROM USERS WHERE email = :email`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan' });
    }

    // Generate OTP (6 digit)
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save OTP to database (table PASSWORD_RESETS)
    await connection.execute(
      `INSERT INTO PASSWORD_RESETS (email, otp, expires_at)
       VALUES (:email, :otp, :expires_at)`,
      { email, otp, expires_at: expiresAt }
    );

    await connection.commit();

    // TODO: Send OTP via email
    console.log(`OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP telah dikirim ke email Anda'
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};

// ================= RESET PASSWORD (Verify OTP) =================
exports.resetPassword = async (req, res) => {
  let connection;
  try {
    const { email, otp, new_password } = req.body;

    if (!email || !otp || !new_password) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    connection = await getConnection();

    const resetResult = await connection.execute(
      `SELECT * FROM PASSWORD_RESETS 
       WHERE email = :email AND otp = :otp AND expires_at > SYSDATE`,
      { email, otp }
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTP tidak valid atau sudah kadaluarsa' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await connection.execute(
      `UPDATE USERS SET password_hash = :hashedPassword WHERE email = :email`,
      { hashedPassword, email }
    );

    await connection.execute(
      `DELETE FROM PASSWORD_RESETS WHERE email = :email`,
      { email }
    );

    await connection.commit();

    res.json({ success: true, message: 'Password berhasil direset' });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (connection) await connection.close();
  }
};