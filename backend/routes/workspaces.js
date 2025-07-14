// routes/workspaces.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/workspaces
router.get('/', authMiddleware, async (req, res) => {
    try {
        let workspaces = await prisma.workspace.findMany({
            where: { members: { some: { userId: req.user.userId } } },
        });
        if (workspaces.length === 0) {
            const newWorkspace = await prisma.workspace.create({
                data: {
                    name: `Kế hoạch cưới của ${req.user.name}`,
                    ownerId: req.user.userId,
                    members: { create: { userId: req.user.userId, role: 'owner' } },
                },
            });
            workspaces.push(newWorkspace);
        }
        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ error: 'Không thể lấy dữ liệu workspace.' });
    }
});

module.exports = router;
