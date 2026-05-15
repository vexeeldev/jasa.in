const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const walletController = require('../controllers/walletController');

// Semua route wallet memerlukan authentication
router.use(authMiddleware);

// Get wallet balance & stats
router.get('/', walletController.getWallet);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Get single transaction
router.get('/transactions/:id', walletController.getTransactionById);

// Get withdrawable balance (untuk freelancer)
router.get('/withdrawable', walletController.getWithdrawableBalance);

// Top up saldo
router.post('/topup', walletController.topUp);

module.exports = router;