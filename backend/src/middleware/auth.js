const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

const optionalVerifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return next();

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (!err) req.user = decoded;
        next();
    });
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole, optionalVerifyToken };
