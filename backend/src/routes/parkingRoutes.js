const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', parkingController.getParkingStatus);
router.post('/simulate', verifyToken, verifyRole(['ADMIN']), parkingController.updateParkingOccupancy);

module.exports = router;
