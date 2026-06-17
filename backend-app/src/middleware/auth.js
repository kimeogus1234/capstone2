const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: '로그인이 필요한 서비스입니다.' });

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'supersecret', (err, decoded) => {
        if (err) return res.status(401).json({ message: '로그인이 만료되었거나 권한이 없습니다.' });
        req.user = decoded;
        next();
    });
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: '접근 권한이 없습니다.' });
        }
        next();
    };
};

/** 로그인 시 req.user 설정, 비로그인도 통과 (장바구니 쿠폰 넛지 등) */
const optionalVerifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, decoded) => {
        if (!err) req.user = decoded;
        next();
    });
};

module.exports = { verifyToken, verifyRole, optionalVerifyToken };
