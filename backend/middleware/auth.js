const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'Platform_jasa.in';

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token tidak valid' });
    }
    req.user = decoded;
    next();
  });
};