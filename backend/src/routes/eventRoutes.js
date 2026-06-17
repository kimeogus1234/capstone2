const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', eventController.getAllEvents);
router.post('/reorder', verifyToken, verifyRole(['ADMIN']), eventController.reorderEvents);
router.post('/', verifyToken, verifyRole(['ADMIN']), eventController.createEvent);
router.put('/:id', verifyToken, verifyRole(['ADMIN']), eventController.updateEvent);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), eventController.deleteEvent);

module.exports = router;
