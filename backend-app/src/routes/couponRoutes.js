const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, couponController.getCoupons);
router.post('/validate', verifyToken, couponController.validateCoupon);
router.post('/check-rewards', verifyToken, couponController.checkRewards);
router.post('/', verifyToken, verifyRole(['ADMIN']), couponController.createCoupon);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), couponController.deleteCoupon);

module.exports = router;
