const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

// 💳 1. 결제하기 (장바구니 -> 결제완료/PAID 전환)
router.post('/', verifyToken, orderController.createOrder);

// 🔍 2. 내 주문 내역 조회 (이승재 님의 결제 완료 기록들)
router.get('/my', verifyToken, orderController.getUserOrders);

// 📊 3. 주문 상태별 개수 조회
router.get('/status-counts', verifyToken, orderController.getOrderStatusCounts);

// ❌ 3. 주문 취소 (결제완료/준비중만)
router.patch('/:id/cancel', verifyToken, orderController.cancelOrder);

// 🔄 4. 반품 신청 (배송중/배송완료)
router.patch('/:id/return', verifyToken, orderController.returnOrder);

// 🔄 5. 교환 신청 (배송중/배송완료)
router.patch('/:id/exchange', verifyToken, orderController.exchangeOrder);

module.exports = router;
