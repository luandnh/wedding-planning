const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yêu cầu xác thực không hợp lệ.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Gắn thông tin user vào request
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = authMiddleware;
