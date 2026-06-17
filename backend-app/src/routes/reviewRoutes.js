const express = require('express');
const router = express.Router();
const { getProductReviews, submitReview } = require('../controllers/reviewController');

// 💬 [NEW] 상품별 리뷰 목록 조회
router.get('/:productId', getProductReviews);

// ✍️ [NEW] 새로운 리뷰 등록
router.post('/', submitReview);

module.exports = router;
