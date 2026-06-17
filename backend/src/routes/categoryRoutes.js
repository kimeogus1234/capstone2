const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, verifyRole, optionalVerifyToken } = require('../middleware/auth');

router.get('/', optionalVerifyToken, categoryController.getCategories);
router.get('/tree', optionalVerifyToken, categoryController.getTree);

// 관리자와 스태프 모두 카테고리 생성/수정/삭제 권한은 있으나, 
// 상세 로직은 컨트롤러에서 isGlobal과 storeId에 따라 제어함
router.post('/', verifyToken, verifyRole(['ADMIN', 'STAFF']), categoryController.createCategory);
router.put('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), categoryController.updateCategory);
router.delete('/:id', verifyToken, verifyRole(['ADMIN', 'STAFF']), categoryController.deleteCategory);

module.exports = router;
