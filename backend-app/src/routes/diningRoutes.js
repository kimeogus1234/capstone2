const express = require('express');
const router = express.Router();
const diningController = require('../controllers/diningController');

// 🏢 음식점 목록 조회
router.get('/restaurants', diningController.getRestaurants);

// 🍱 메뉴 목록 조회 (특정 음식점 선택 가능)
router.get('/menus', diningController.getMenus);
router.get('/menus/:restaurantId', diningController.getMenus);

// ✨ 하이라이트 (인기 매장 & 추천 메뉴)
router.get('/highlights', diningController.getHighlights);

module.exports = router;
