const oracledb = require('oracledb');
const db = require('../config/db');

// ✅ WAJIB: Supaya kolom BIO (CLOB) dibaca sebagai string biasa, bukan Stream
oracledb.fetchAsString = [oracledb.CLOB];

/**
 * GET: Ambil Profil Lengkap (Private)
 */
exports.getMyFullProfile = async (req, res) => {
    let connection;
    try {
        const userId = req.user.user_id; // Pastikan middleware auth sudah pasang ini
        connection = await db.getConnection();

        // 1. Ambil Data Dasar User & Freelancer Profile
        const userRes = await connection.execute(
            `SELECT u.user_id, u.username, u.full_name, u.email, u.phone, 
                    u.avatar_url, u.role, u.balance, u.created_at,
                    fp.freelancer_id, fp.bio, fp.rating_avg,
                    fp.total_orders, fp.freelancer_level, fp.joined_at
             FROM USERS u
             LEFT JOIN FREELANCER_PROFILES fp ON u.user_id = fp.user_id
             WHERE u.user_id = :id`,
            { id: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const u = userRes.rows[0];
        if (!u) {
            return res.status(404).json({ success: true, message: "User not found" });
        }

        const fid = u.FREELANCER_ID || 0;

        // 2. Ambil Skills
        const skillsRes = await connection.execute(
            `SELECT s.name FROM FREELANCER_SKILLS fs
             JOIN SKILLS s ON fs.skill_id = s.skill_id
             WHERE fs.freelancer_id = :fid`,
            { fid: fid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 3. Ambil Services + Harga Termurah
        const servicesRes = await connection.execute(
            `SELECT s.service_id, s.title, s.thumbnail_url, s.total_orders,
                    (SELECT MIN(price) FROM SERVICE_PACKAGES WHERE service_id = s.service_id) as min_price
             FROM SERVICES s
             WHERE s.freelancer_id = :fid AND s.status = 'active'`,
            { fid: fid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 4. Ambil Portofolio
        const portRes = await connection.execute(
            `SELECT portfolio_id, title, description, image_url
             FROM PORTFOLIOS WHERE freelancer_id = :fid`,
            { fid: fid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 🔥 MANUAL MAPPING: Memutus hubungan dengan objek internal Oracle
        // Ini kunci supaya nggak kena "Circular Structure Error"
        const cleanUser = {
            user_id: Number(u.USER_ID),
            username: String(u.USERNAME || ''),
            full_name: String(u.FULL_NAME || ''),
            email: String(u.EMAIL || ''),
            phone: String(u.PHONE || ''),
            avatar_url: String(u.AVATAR_URL || ''),
            role: String(u.ROLE || 'klien'),
            balance: Number(u.BALANCE || 0),
            created_at: u.CREATED_AT,
            // Profil Detail
            bio: String(u.BIO || 'Belum ada bio.'),
            rating_avg: Number(u.RATING_AVG || 0),
            total_orders: Number(u.TOTAL_ORDERS || 0),
            freelancer_level: String(u.FREELANCER_LEVEL || 'New Member'),
            // Data List
            SKILLS: skillsRes.rows.map(s => String(s.NAME)),
            SERVICES: servicesRes.rows.map(s => ({
                SERVICE_ID: Number(s.SERVICE_ID),
                TITLE: String(s.TITLE || ''),
                THUMBNAIL_URL: String(s.THUMBNAIL_URL || ''),
                TOTAL_ORDERS: Number(s.TOTAL_ORDERS || 0),
                PRICE: Number(s.MIN_PRICE || 0)
            })),
            PORTFOLIOS: portRes.rows.map(p => ({
                PORTFOLIO_ID: Number(p.PORTFOLIO_ID),
                TITLE: String(p.TITLE || ''),
                DESCRIPTION: String(p.DESCRIPTION || ''),
                IMAGE_URL: String(p.IMAGE_URL || '')
            }))
        };

        return res.json({
            success: true,
            user: cleanUser
        });

    } catch (err) {
        console.error('Error Profile Me:', err.message);
        // ✅ JANGAN kirim objek 'err' utuh ke .json(), kirim pesannya aja
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: err.message 
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error closing connection:", closeErr);
            }
        }
    }
};

/**
 * PUT: Update Profil
 */
exports.updateProfile = async (req, res) => {
    let connection;
    try {
        const userId = req.user.user_id;
        const { full_name, phone, bio, avatar_url } = req.body;

        connection = await db.getConnection();

        // 1. Update USERS
        await connection.execute(
            `UPDATE USERS 
             SET full_name = :full_name, 
                 phone = :phone, 
                 avatar_url = :avatar_url 
             WHERE user_id = :id`,
            { full_name, phone, avatar_url, id: userId },
            { autoCommit: false }
        );

        // 2. MERGE FREELANCER_PROFILES
        await connection.execute(
            `MERGE INTO FREELANCER_PROFILES fp
             USING (SELECT :id as user_id FROM DUAL) src
             ON (fp.user_id = src.user_id)
             WHEN MATCHED THEN
                UPDATE SET bio = :bio
             WHEN NOT MATCHED THEN
                INSERT (user_id, bio) VALUES (:id, :bio)`,
            { id: userId, bio: bio || '' },
            { autoCommit: false }
        );

        await connection.commit();

        return res.json({
            success: true,
            message: 'Profil berhasil diperbarui!'
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Update Error:', err.message);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) {}
        }
    }
};