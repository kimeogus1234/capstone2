const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// 소비자용
router.post('/', verifyToken, orderController.createOrder);
router.get('/my', verifyToken, orderController.getMyOrders);

// 관리자 및 배달원용 (전체 주문 관제 및 배송 상태 변경)
router.get('/all', verifyToken, verifyRole(['ADMIN', 'STAFF', 'DELIVERY']), orderController.getAllOrders);
router.get('/delivery-all', verifyToken, verifyRole(['ADMIN', 'STAFF', 'DELIVERY']), orderController.getDeliveryOrders);
router.put('/status/:id', verifyToken, verifyRole(['ADMIN', 'STAFF', 'DELIVERY']), orderController.updateOrderStatus);
router.put('/:id/status', verifyToken, verifyRole(['ADMIN', 'STAFF', 'DELIVERY']), orderController.updateOrderStatus);

module.exports = router;
