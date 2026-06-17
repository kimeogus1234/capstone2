const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, createUser, deleteUser } = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Only Admin can manage users
router.get('/', verifyToken, verifyRole(['ADMIN']), getUsers);
router.post('/', verifyToken, verifyRole(['ADMIN']), createUser);
router.put('/:id/role', verifyToken, verifyRole(['ADMIN']), updateUserRole);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), deleteUser);

module.exports = router;
