const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', storeController.getAllStores);
router.get('/:id/delete-preview', verifyToken, verifyRole(['ADMIN']), storeController.getDeletePreview);
router.get('/:id', storeController.getStoreById);
router.post('/', verifyToken, verifyRole(['ADMIN']), storeController.createStore);
router.put('/:id', verifyToken, verifyRole(['ADMIN']), storeController.updateStore);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), storeController.deleteStore);

module.exports = router;
