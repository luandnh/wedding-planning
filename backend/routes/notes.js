// routes/notes.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Lấy tất cả ghi chú cho một workspace
router.get('/workspaces/:workspaceId/notes', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const notes = await prisma.note.findMany({
            where: {
                workspaceId: workspaceId,
                workspace: { members: { some: { userId: req.user.userId } } }
            },
            include: {
                attachments: true // Lấy kèm các file media đính kèm
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Không thể lấy danh sách ghi chú.' });
    }
});

// Tạo một ghi chú mới (có thể đính kèm media)
router.post('/workspaces/:workspaceId/notes', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { content, mediaIds } = req.body; // mediaIds là một mảng các ID của file đã upload
    if (!content) return res.status(400).json({ error: 'Nội dung ghi chú là bắt buộc.' });

    try {
        const newNote = await prisma.note.create({
            data: {
                content,
                workspaceId,
                attachments: {
                    connect: mediaIds?.map(id => ({ id })) // Kết nối với các media đã có
                }
            },
            include: { attachments: true }
        });
        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Không thể tạo ghi chú.' });
    }
});

// Xóa một ghi chú
router.delete('/notes/:noteId', authMiddleware, async (req, res) => {
    const { noteId } = req.params;
    try {
        // Cần kiểm tra quyền của user ở đây (bỏ qua để đơn giản)
        await prisma.note.delete({ where: { id: noteId } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Không thể xóa ghi chú.' });
    }
});

module.exports = router;
