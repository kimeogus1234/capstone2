const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// 소비자용
router.get('/available', verifyToken, promotionController.getAvailableCoupons);
router.get('/my-coupons', verifyToken, promotionController.getMyCoupons); // 내 쿠폰함
router.post('/validate', verifyToken, promotionController.validateCoupon);
router.post('/suggestions', promotionController.checkEligibility); // 장바구니 혜택 추천

// 관리자/매장직원용 (쿠폰)
router.get('/', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.getAllCoupons);
router.post('/', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.createCoupon);
router.put('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.updateCoupon);
router.delete('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.deleteCoupon);

// 관리자/매장직원용 (프로모션 규칙)
router.get('/rules', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.getAllPromotionRules);
router.post('/rules', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.createPromotionRule);
router.put('/rules/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.updatePromotionRule);
router.delete('/rules/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), promotionController.deletePromotionRule);

module.exports = router;
