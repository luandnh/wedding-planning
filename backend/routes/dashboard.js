// routes/dashboard.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/workspaces/:workspaceId/dashboard
router.get('/workspaces/:workspaceId/dashboard', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { userId } = req.user;

    try {
        // Check user permission for the workspace
        const member = await prisma.workspaceUser.findFirst({
            where: { userId, workspaceId },
        });
        if (!member) {
            return res.status(403).json({ error: 'Không có quyền truy cập.' });
        }

        // 1. Get Wedding Config for wedding date
        const config = await prisma.weddingConfig.findUnique({
            where: { workspaceId },
        });

        // 2. Aggregate Budget Data
        const budgetAggregation = await prisma.budgetItem.aggregate({
            _sum: {
                expectedAmount: true,
                actualAmount: true,
            },
            where: {
                budget: {
                    workspaceId: workspaceId,
                },
            },
        });

        // 3. Aggregate Task Data
        const upcomingTasks = await prisma.task.findMany({
            where: {
                workspaceId: workspaceId,
                status: { not: 'done' }
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: 5,
        });
        const taskCount = await prisma.task.count({ where: { workspaceId: workspaceId } });
        const doneTaskCount = await prisma.task.count({ where: { workspaceId: workspaceId, status: 'done' } });

        // 4. Aggregate Guest Data
        const guestCount = await prisma.guest.count({ where: { workspaceId: workspaceId } });

        // 5. Combine all data
        const dashboardData = {
            config: {
                groomName: config?.groomName,
                brideName: config?.brideName,
                importantDates: config?.importantDates || [],
            },
            budget: {
                totalExpected: budgetAggregation._sum.expectedAmount || 0,
                totalActual: budgetAggregation._sum.actualAmount || 0,
            },
            tasks: {
                upcoming: upcomingTasks,
                total: taskCount,
                done: doneTaskCount,
            },
            guests: {
                total: guestCount,
            }
        };

        res.json(dashboardData);

    } catch (error) {
        console.error("Dashboard data error:", error);
        res.status(500).json({ error: 'Không thể lấy dữ liệu tổng quan.' });
    }
});

module.exports = router;
