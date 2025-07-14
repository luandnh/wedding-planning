// routes/members.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Lấy tất cả thành viên cho một workspace
router.get('/workspaces/:workspaceId/members', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const members = await prisma.workspaceUser.findMany({
            where: { workspaceId },
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Không thể lấy danh sách thành viên.' });
    }
});

// Mời một thành viên mới vào workspace
router.post('/workspaces/:workspaceId/members', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.userId;

    if (!email) return res.status(400).json({ error: 'Email là bắt buộc.' });

    try {
        // 1. Kiểm tra xem người mời có phải là chủ sở hữu không
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace || workspace.ownerId !== inviterId) {
            return res.status(403).json({ error: 'Chỉ chủ sở hữu mới có quyền mời thành viên.' });
        }

        // 2. Tìm người dùng được mời qua email
        const userToInvite = await prisma.user.findUnique({ where: { email } });
        if (!userToInvite) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng với email này.' });
        }

        // 3. Kiểm tra xem người dùng đã là thành viên chưa
        const existingMember = await prisma.workspaceUser.findFirst({
            where: { workspaceId, userId: userToInvite.id }
        });
        if (existingMember) {
            return res.status(409).json({ error: 'Người dùng này đã là thành viên.' });
        }

        // 4. Thêm người dùng vào workspace
        const newMember = await prisma.workspaceUser.create({
            data: {
                workspaceId,
                userId: userToInvite.id,
                role: 'member'
            },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        res.status(201).json(newMember);

    } catch (error) {
        res.status(500).json({ error: 'Không thể mời thành viên.' });
    }
});

// Xóa một thành viên khỏi workspace
router.delete('/workspaces/:workspaceId/members/:userId', authMiddleware, async (req, res) => {
    const { workspaceId, userId } = req.params;
    const removerId = req.user.userId;

    try {
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace || workspace.ownerId !== removerId) {
            return res.status(403).json({ error: 'Chỉ chủ sở hữu mới có quyền xóa thành viên.' });
        }
        if (workspace.ownerId === userId) {
            return res.status(400).json({ error: 'Không thể xóa chủ sở hữu khỏi workspace.' });
        }

        await prisma.workspaceUser.delete({
            where: { workspaceId_userId: { workspaceId, userId } }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Không thể xóa thành viên.' });
    }
});

module.exports = router;
