const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// 누구나 지도 및 층 조회 가능
router.get('/', mapController.getMaps);
router.get('/floors', mapController.getFloors);
router.get('/markers/:id', mapController.getMarkerById);

// 관리자 전용
router.post('/', verifyToken, verifyRole(['ADMIN']), mapController.updateMap);
router.post('/floors', verifyToken, verifyRole(['ADMIN']), mapController.addFloor);
router.delete('/floors/:floor', verifyToken, verifyRole(['ADMIN']), mapController.deleteFloor);
router.post('/markers', verifyToken, verifyRole(['ADMIN']), mapController.createMarker);
router.put('/markers/:id', verifyToken, verifyRole(['ADMIN']), mapController.updateMarker);
router.delete('/markers/:id', verifyToken, verifyRole(['ADMIN']), mapController.deleteMarker);
router.post('/markers/bulk-delete', verifyToken, verifyRole(['ADMIN']), mapController.bulkDeleteMarkers);

module.exports = router;
