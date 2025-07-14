// routes/configs.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Lấy hoặc tạo mới cấu hình cho một workspace
router.get('/workspaces/:workspaceId/config', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        let config = await prisma.weddingConfig.findUnique({
            where: { workspaceId: workspaceId },
        });

        if (!config) {
            // Nếu chưa có config, tạo một cái mặc định
            config = await prisma.weddingConfig.create({
                data: {
                    workspaceId: workspaceId,
                    groomName: '',
                    brideName: '',
                    venue: '',
                    importantDates: [], // Mặc định là một mảng rỗng
                }
            });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Không thể lấy dữ liệu cấu hình.' });
    }
});

// Cập nhật cấu hình cho một workspace
router.put('/workspaces/:workspaceId/config', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    // Lấy tất cả các trường có thể có từ body
    const { groomName, brideName, venue, logoUrl, importantDates } = req.body;
    try {
        const updatedConfig = await prisma.weddingConfig.upsert({
            where: { workspaceId: workspaceId },
            update: { groomName, brideName, venue, logoUrl, importantDates },
            create: { workspaceId, groomName, brideName, venue, logoUrl, importantDates }
        });
        res.json(updatedConfig);
    } catch (error) {
        console.error("Lỗi cập nhật cấu hình:", error);
        res.status(500).json({ error: 'Không thể cập nhật cấu hình.' });
    }
});

module.exports = router;
