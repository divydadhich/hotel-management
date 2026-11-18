const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');

// Create payment order (can be called by customer checkout or staff)
router.post('/create-order', paymentController.createPaymentOrder);

// Verify signature (called after Razorpay checkout returns)
router.post('/verify', paymentController.verifyPayment);

// Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
