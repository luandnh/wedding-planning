// routes/tasks.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/workspaces/:workspaceId/tasks', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const tasks = await prisma.task.findMany({
            where: { workspaceId, workspace: { members: { some: { userId: req.user.userId } } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (error) { res.status(500).json({ error: 'Không thể lấy dữ liệu công việc.' }); }
});
router.post('/workspaces/:workspaceId/tasks', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { title, description, status, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Tiêu đề công việc là bắt buộc.' });
    try {
        const newTask = await prisma.task.create({
            data: { title, description, status: status || 'todo', priority: priority || 'medium', workspaceId }
        });
        res.status(201).json(newTask);
    } catch (error) { res.status(500).json({ error: 'Không thể tạo công việc.' }); }
});
router.put('/tasks/:taskId', authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, priority } = req.body;
    try {
        const updatedTask = await prisma.task.update({ where: { id: taskId }, data: { title, description, status, priority } });
        res.json(updatedTask);
    } catch (error) { res.status(500).json({ error: 'Không thể cập nhật công việc.' }); }
});
router.delete('/tasks/:taskId', authMiddleware, async (req, res) => {
    const { taskId } = req.params;
    try {
        await prisma.task.delete({ where: { id: taskId } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Không thể xóa công việc.' }); }
});

module.exports = router;
