const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { verifyToken, verifyRole } = require('../middleware/auth');
const multer = require('multer');

// POST /api/upload - 계정이 있는 관리자/스태프만 접근 가능하도록 수정
router.post('/', verifyToken, verifyRole(['ADMIN', 'STAFF']), (req, res) => {
    // Multer의 에러를 잡기 위해 실행 함수 형태로 변경
    upload.single('image')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // 용량 초과 등 Multer의 자체 에러
            console.error('--- [Multer Spec Error] ---');
            console.error(err);
            return res.status(500).json({ error: `Multer Error: ${err.message}` });
        } else if (err) {
            // 확장자 제한 등 기타 에러
            console.error('--- [Internal Upload Error] ---');
            console.error(err);
            return res.status(500).json({ error: `Upload Error: ${err.message}` });
        }

        // 파일 유무 최종 확인
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        // 업로드 성공
        const imageUrl = `/uploads/${req.file.filename}`;
        console.log(`[성공] 이미지 업로드 완료: ${imageUrl}`);
        
        res.json({
            message: 'Image uploaded successfully',
            url: imageUrl
        });
    });
});

module.exports = router;
