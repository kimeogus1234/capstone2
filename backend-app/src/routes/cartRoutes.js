const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

// 🔍 해당 로그인한 유저의 장바구니 내용 조회
router.get('/', verifyToken, cartController.getCart);

// ➕ 장바구니에 아이템 추가 (또는 수량 합산) - 양대 엔드포인트 포맷 모두 지원
router.post('/add', verifyToken, cartController.addToCart);
router.post('/', verifyToken, cartController.addToCart);

// ✏️ 수량 및 선택여부 수정 - 양대 엔드포인트 포맷 모두 지원
router.put('/update', verifyToken, cartController.updateItem);
router.put('/', verifyToken, cartController.updateItem);

// 🧹 장바구니 비우기
router.delete('/clear', verifyToken, cartController.clearCart);

// ❌ 특정 아이템 삭제
router.delete('/:productId', verifyToken, cartController.removeFromCart);

module.exports = router;
