// routes/guests.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Lấy tất cả khách mời cho một workspace
router.get('/workspaces/:workspaceId/guests', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const guests = await prisma.guest.findMany({
            where: {
                workspaceId: workspaceId,
                workspace: { members: { some: { userId: req.user.userId } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Không thể lấy danh sách khách mời.' });
    }
});

// Tạo một khách mời mới
router.post('/workspaces/:workspaceId/guests', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { name, phone, side, status } = req.body;
    if (!name || !side) return res.status(400).json({ error: 'Tên và phe (nhà trai/gái) là bắt buộc.' });
    try {
        const newGuest = await prisma.guest.create({
            data: {
                name,
                phone,
                side,
                status: status || 'pending',
                workspaceId: workspaceId,
            }
        });
        res.status(201).json(newGuest);
    } catch (error) {
        res.status(500).json({ error: 'Không thể tạo khách mời.' });
    }
});

// Cập nhật một khách mời
router.put('/guests/:guestId', authMiddleware, async (req, res) => {
    const { guestId } = req.params;
    const { name, phone, side, status } = req.body;
    try {
        const updatedGuest = await prisma.guest.update({
            where: { id: guestId },
            data: { name, phone, side, status }
        });
        res.json(updatedGuest);
    } catch (error) {
        res.status(500).json({ error: 'Không thể cập nhật khách mời.' });
    }
});

// Xóa một khách mời
router.delete('/guests/:guestId', authMiddleware, async (req, res) => {
    const { guestId } = req.params;
    try {
        await prisma.guest.delete({ where: { id: guestId } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Không thể xóa khách mời.' });
    }
});

module.exports = router;
