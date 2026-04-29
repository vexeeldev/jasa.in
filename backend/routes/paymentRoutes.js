const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const { isFreelancer } = require('../middleware/roleMiddleware');

// Semua route payment memerlukan authentication
router.use(authMiddleware);

// ================= BALANCE & TRANSACTIONS =================
// Get balance (saldo, pending escrow, total spent, total earned)
router.get('/balance', paymentController.getBalance);

// Get transaction history
router.get('/transactions', paymentController.getTransactionHistory);

// Get available payment methods
router.get('/methods', paymentController.getPaymentMethods);

// ================= TOP UP =================
// Top up saldo
router.post('/topup', paymentController.topUp);

// ================= WITHDRAWAL (Freelancer only) =================
// Withdraw saldo
router.post('/withdraw', isFreelancer, paymentController.withdraw);

// Get withdrawal history
router.get('/withdrawals', isFreelancer, paymentController.getWithdrawalHistory);

module.exports = router;