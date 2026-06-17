const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 🛒 [소비자 전용] 상품 조회 및 검색 라우트
router.get('/', productController.getAllProducts);           // 전체 목록 (판매 중인 상품만)
router.get('/search', productController.searchProducts);      // 프리미엄 검색
router.get('/:id', productController.getProductDetail);      // 상세 정보
router.get('/nfc/:uid', productController.getProductByNfcUid); // NFC 태그 조회

// ⚠️ 보안 안내: 소비자용 백엔드이므로 상품의 등록, 수정, 삭제 라우트는 제공하지 않습니다.
// 해당 작업은 관리자용 백엔드(Main Backend)를 통해서만 수행됩니다.

module.exports = router;
