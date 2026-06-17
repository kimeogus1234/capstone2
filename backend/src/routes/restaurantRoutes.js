const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

// 관리자 권한 필요
router.post('/', verifyToken, verifyRole(['ADMIN']), restaurantController.createRestaurant);
router.put('/:id', verifyToken, verifyRole(['ADMIN']), restaurantController.updateRestaurant);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), restaurantController.deleteRestaurant);

module.exports = router;
