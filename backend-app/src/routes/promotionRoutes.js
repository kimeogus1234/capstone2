const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { verifyToken, verifyRole, optionalVerifyToken } = require('../middleware/auth');

router.get('/', promotionController.getPromotions);
router.post('/suggestions', optionalVerifyToken, promotionController.checkEligibility); // 📈 실시간 장바구니 퀘스트 추천
router.post('/', verifyToken, verifyRole(['ADMIN']), promotionController.createPromotion);
router.put('/:id', verifyToken, verifyRole(['ADMIN']), promotionController.updatePromotion);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), promotionController.deletePromotion);

module.exports = router;
