const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp + random + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let ext = path.extname(file.originalname).toLowerCase();
        // .jfif 및 .jpeg 확장자는 브라우저 및 모바일 앱(Fresco) 호환성을 위해 .jpg로 통합합니다.
        if (ext === '.jfif' || ext === '.jpeg') {
            ext = '.jpg';
        }
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    console.log(`[업로드 시도] 파일명: ${file.originalname}, 마임타입: ${file.mimetype}`);
    
    // Accept more image formats (case-insensitive)
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|jfif|bmp|heic|heif)$/i)) {
        return cb(new Error(`Only image files are allowed! (Got: ${file.originalname})`), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
