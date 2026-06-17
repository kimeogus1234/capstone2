const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, getAddresses, updateAddresses, getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Address Management
router.get('/addresses', verifyToken, getAddresses);
router.put('/addresses', verifyToken, updateAddresses);

// Wishlist (찜하기) Management
router.get('/wishlist', verifyToken, getWishlist);
router.post('/wishlist', verifyToken, addToWishlist);
router.delete('/wishlist/:productId', verifyToken, removeFromWishlist);

// Only Admin can manage users
router.get('/', verifyToken, verifyRole(['ADMIN']), getUsers);
router.put('/:id/role', verifyToken, verifyRole(['ADMIN']), updateUserRole);

module.exports = router;
