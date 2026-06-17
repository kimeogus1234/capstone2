const express = require('express');
const router = express.Router();
const { getFloors, getMarkers, createMarker, updateMarker, deleteMarker, assignSlot, removeSlot, updateFloorPlan, getMarkerById } = require('../controllers/mapController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/floors', verifyToken, getFloors);
router.get('/', verifyToken, getMarkers);
router.get('/markers/:id', verifyToken, getMarkerById);
router.put('/floorplan', verifyToken, verifyRole(['ADMIN', 'STAFF']), updateFloorPlan);
router.post('/', verifyToken, verifyRole(['ADMIN', 'STAFF']), createMarker);
router.put('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), updateMarker);
router.delete('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), deleteMarker);
router.post('/:markerId/slots', verifyToken, verifyRole(['ADMIN', 'STAFF']), assignSlot);
router.delete('/:markerId/slots/:slotNumber', verifyToken, verifyRole(['ADMIN', 'STAFF']), removeSlot);

module.exports = router;
