const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/auth');
const { isFreelancer } = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ================= KONFIGURASI MULTER DENGAN EKSTENSI FILE =================
const uploadDir = 'uploads/services';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage dengan ekstensi file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // ambil .png, .jpg, dll
    cb(null, 'service-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ================= PUBLIC ROUTES =================
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);

// ================= PROTECTED ROUTES =================
router.use(authMiddleware);

// 🔥 ROUTE GALLERY - HARUS DULUAN sebelum route /:id
router.put('/:id/gallery', isFreelancer, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { gallery } = req.body;
    const userId = req.user.user_id;
    
    console.log('🔥 GALLERY API - ID:', id);
    console.log('🔥 GALLERY DATA:', gallery);
    
    const db = require('../config/db');
    connection = await db.getConnection();
    
    // Cek kepemilikan
    const check = await connection.execute(
      `SELECT s.service_id FROM SERVICES s
       JOIN FREELANCER_PROFILES fp ON s.freelancer_id = fp.freelancer_id
       WHERE s.service_id = :id AND fp.user_id = :userId`,
      { id: parseInt(id), userId: parseInt(userId) },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki akses' });
    }
    
    // Update gallery
    const img1 = gallery && gallery[0] ? gallery[0] : null;
    const img2 = gallery && gallery[1] ? gallery[1] : null;
    const img3 = gallery && gallery[2] ? gallery[2] : null;
    
    console.log('Updating with:', { img1, img2, img3, id: parseInt(id) });
    
    await connection.execute(
      `UPDATE SERVICES SET IMAGE_1 = :img1, IMAGE_2 = :img2, IMAGE_3 = :img3 WHERE service_id = :id`,
      { img1: img1, img2: img2, img3: img3, id: parseInt(id) }
    );
    
    await connection.commit();
    
    // Verifikasi
    const verify = await connection.execute(
      `SELECT IMAGE_1, IMAGE_2, IMAGE_3 FROM SERVICES WHERE service_id = :id`,
      { id: parseInt(id) },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    console.log('✅ Verifikasi setelah update:', verify.rows[0]);
    
    res.json({ success: true, message: 'Gallery berhasil diupdate' });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('GALLERY API ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// Upload routes
router.post('/upload-thumbnail', isFreelancer, upload.single('image'), serviceController.uploadServiceThumbnail);
router.post('/upload-gallery', isFreelancer, upload.array('images', 3), serviceController.uploadServiceGallery);

// CRUD routes
router.post('/', isFreelancer, serviceController.createService);
router.put('/:id', isFreelancer, serviceController.editService);
router.put('/:id/packages', isFreelancer, serviceController.updatePackages);
router.delete('/:id', isFreelancer, serviceController.deleteService);
router.get('/my-services/me', isFreelancer, serviceController.getMyServices);
router.get('/packages/:id', serviceController.getPackageById);

module.exports = router;