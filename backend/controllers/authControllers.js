const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('oracledb');

const JWT_SECRET = process.env.SECRET_KEYS || 'Platform_jasa.in';

// ========== LOGIN ==========
exports.login = async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi'
            });
        }

        connection = await getConnection();

        // Query user dengan JOIN ke freelancer_profiles untuk cek status freelancer
        const userResult = await connection.execute(
            `SELECT u.user_id, u.username, u.email, u.password_hash, 
                    u.full_name, u.phone, u.avatar_url, 
                    u.is_freelancer, u.is_admin, u.is_verified, u.balance,
                    fp.profile_id, fp.freelancer_level, fp.rating_avg
             FROM USERS u
             LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
             WHERE u.email = :email`,
            [email],
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        const user = userResult.rows[0];

        // Verifikasi password
        const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                user_id: user.USER_ID,
                username: user.USERNAME,
                email: user.EMAIL,
                is_freelancer: user.IS_FREELANCER,
                is_admin: user.IS_ADMIN
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Hapus password_hash dari response
        delete user.PASSWORD_HASH;

        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: user,
                token: token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
};

// ========== REGISTER ==========
exports.register = async (req, res) => {
    let connection;
    try {
        const {
            username,
            password,
            email,
            full_name,
            phone,
            is_freelancer = '0'  // Default bukan freelancer
        } = req.body;

        // Validasi input
        if (!username || !password || !email || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, email, dan full_name wajib diisi'
            });
        }

        // Validasi email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format email tidak valid'
            });
        }

        // Validasi panjang password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 6 karakter'
            });
        }

        connection = await getConnection();

        // Cek username sudah digunakan atau belum
        const checkUsername = await connection.execute(
            `SELECT COUNT(*) as count FROM USERS WHERE username = :username`,
            [username],
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        if (checkUsername.rows[0].COUNT > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan'
            });
        }

        // Cek email sudah digunakan atau belum
        const checkEmail = await connection.execute(
            `SELECT COUNT(*) as count FROM USERS WHERE email = :email`,
            [email],
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        if (checkEmail.rows[0].COUNT > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user baru (user_id auto-generated by IDENTITY)
        const result = await connection.execute(
            `INSERT INTO USERS (
                username, email, password_hash, full_name, phone, 
                is_freelancer, is_admin, is_verified, balance
            ) VALUES (
                :username, :email, :password_hash, :full_name, :phone,
                :is_freelancer, '0', '0', 0
            ) RETURNING user_id INTO :user_id`,
            {
                username: username,
                email: email,
                password_hash: hashedPassword,
                full_name: full_name,
                phone: phone || null,
                is_freelancer: is_freelancer,
                user_id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
            },
            { autoCommit: false }
        );

        const userId = result.outBinds.user_id[0];

        // Jika register sebagai freelancer, buatkan profile freelancer
        if (is_freelancer === '1') {
            await connection.execute(
                `INSERT INTO FREELANCER_PROFILES (user_id, bio, freelancer_level)
                 VALUES (:user_id, :bio, 'new')`,
                {
                    user_id: userId,
                    bio: null
                },
                { autoCommit: false }
            );
        }

        // Commit transaction
        await connection.commit();

        // Generate JWT Token
        const token = jwt.sign(
            {
                user_id: userId,
                username: username,
                email: email,
                is_freelancer: is_freelancer,
                is_admin: '0'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: is_freelancer === '1' ? 'Registrasi freelancer berhasil' : 'Registrasi berhasil',
            data: {
                user: {
                    user_id: userId,
                    username: username,
                    email: email,
                    full_name: full_name,
                    phone: phone || null,
                    is_freelancer: is_freelancer,
                    is_admin: '0',
                    is_verified: '0',
                    balance: 0
                },
                token: token
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        
        if (connection) {
            try {
                await connection.rollback();
            } catch (err) {
                console.error('Error rolling back:', err);
            }
        }

        // Handle Oracle specific errors
        if (error.errorNum === 1) { // Unique constraint violation
            return res.status(400).json({
                success: false,
                message: 'Username atau email sudah terdaftar'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server',
            error: error.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
};

// ========== LOGOUT (optional) ==========
exports.logout = async (req, res) => {
    // Karena JWT stateless, logout cukup di client dengan menghapus token
    return res.status(200).json({
        success: true,
        message: 'Logout berhasil'
    });
};

// ========== VERIFY TOKEN (middleware) ==========
exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid atau sudah kadaluarsa'
            });
        }
        req.user = decoded;
        next();
    });
};

// ========== GET CURRENT USER ==========
exports.getCurrentUser = async (req, res) => {
    let connection;
    try {
        const userId = req.user.user_id;

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT u.user_id, u.username, u.email, u.full_name, u.phone, 
                    u.avatar_url, u.is_freelancer, u.is_admin, u.is_verified, u.balance,
                    fp.profile_id, fp.bio, fp.rating_avg, fp.total_orders, fp.freelancer_level
             FROM USERS u
             LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
             WHERE u.user_id = :userId`,
            [userId],
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
};