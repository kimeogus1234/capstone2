const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/charge', require('../middleware/auth').verifyToken, require('../controllers/authController').chargeMileage);

module.exports = router;
