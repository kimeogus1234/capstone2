const express = require('express');
const router = express.Router();
const { lockSlot, updatePrice } = require('../controllers/slotController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/:id/lock', verifyToken, lockSlot);
router.post('/:id/price', verifyToken, verifyRole(['STAFF', 'ADMIN']), updatePrice);

module.exports = router;
