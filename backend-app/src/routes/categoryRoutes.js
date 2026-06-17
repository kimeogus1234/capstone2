const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 🏷️ [소비자 전용] 카테고리 라우트
router.get('/', categoryController.getCategories);       // 평면 리스트 조회
router.get('/tree', categoryController.getTree);         // 계층형 트리 조회
router.get('/:parentId', categoryController.getSubCategories); // 특정 하위 조회

module.exports = router;
