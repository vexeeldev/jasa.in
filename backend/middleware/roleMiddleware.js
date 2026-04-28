// Cek role client (klien)
const isClient = (req, res, next) => {
  const role = req.user.role;
  if (role === 'klien' || role === 'client') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Akses hanya untuk klien' });
  }
};

// Cek role freelancer
const isFreelancer = (req, res, next) => {
  const role = req.user.role;
  if (role === 'freelancer') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Akses hanya untuk freelancer' });
  }
};

// Cek admin
const isAdmin = (req, res, next) => {
  const role = req.user.role;
  if (role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Akses hanya untuk admin' });
  }
};

// Cek ownership (order/service milik user)
const checkOwnership = (req, res, next) => {
  // Ini akan diimplementasikan di masing-masing controller
  next();
};

module.exports = { isClient, isFreelancer, isAdmin, checkOwnership };