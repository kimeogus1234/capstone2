const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// 대시보드 통계 데이터 조회
router.get('/dashboard', statsController.getDashboardStats);

module.exports = router;
