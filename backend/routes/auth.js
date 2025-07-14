// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'Email hoặc mật khẩu không đúng.' });
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
        const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        const { passwordHash, ...userWithoutPassword } = user;
        res.status(200).json({ message: 'Đăng nhập thành công!', token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Đã có lỗi xảy ra.' });
    }
});

module.exports = router;
