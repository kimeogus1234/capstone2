// productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyRole, optionalVerifyToken } = require('../middleware/auth');

// 🔍 모든 상품 조회 (토큰이 없어도 조회는 가능하도록 optionalVerifyToken 사용)
router.get('/', optionalVerifyToken, productController.getAllProducts);

// 📱 NFC 관련 기능
router.get('/nfc-redirect/:id', productController.renderNfcRedirect);
router.get('/nfc/:uid', productController.getProductByNfcUid);

// 💡 추천 및 요약
router.get('/recommendations/:id', productController.getRecommendations);
router.get('/summary', verifyToken, productController.getSummary);

// 📄 상품 상세
router.get('/:id', productController.getProductDetail);

// 🛠️ 상품 관리 (권한 체크 포함)
router.post('/', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.createProduct);
router.put('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.updateProduct);
router.put('/:id/nfc', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.updateProductNfc);
router.post('/:id/refill', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.refillProduct);
router.delete('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.deleteProduct);

// 🚀 벌크 관리 기능
router.post('/bulk-delete', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.bulkDeleteProducts);
router.post('/bulk-update-status', verifyToken, verifyRole(['ADMIN', 'STAFF']), productController.bulkUpdateProductStatus);

module.exports = router;
