// routes/budgets.js
const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// --- Budget Category ---
router.get('/workspaces/:workspaceId/budgets', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    try {
        const budgetData = await prisma.budget.findMany({
            where: { workspaceId, workspace: { members: { some: { userId: req.user.userId } } } },
            include: { items: { orderBy: { createdAt: 'asc' } } },
            orderBy: { order: 'asc' }
        });
        res.json(budgetData);
    } catch (error) { res.status(500).json({ error: 'Không thể lấy dữ liệu ngân sách.' }); }
});
router.post('/workspaces/:workspaceId/budgets', authMiddleware, async (req, res) => {
    const { workspaceId } = req.params;
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'Tên danh mục là bắt buộc.' });
    try {
        const newBudgetCategory = await prisma.budget.create({ data: { category, workspaceId } });
        res.status(201).json(newBudgetCategory);
    } catch (error) { res.status(500).json({ error: 'Không thể tạo danh mục ngân sách.' }); }
});
router.delete('/budgets/:budgetId', authMiddleware, async (req, res) => {
    const { budgetId } = req.params;
    try {
        await prisma.budget.delete({ where: { id: budgetId } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Không thể xóa danh mục.' }); }
});

// --- Budget Item ---
router.post('/budgets/:budgetId/items', authMiddleware, async (req, res) => {
    const { budgetId } = req.params;
    const { name, expectedAmount } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên khoản mục là bắt buộc.' });
    try {
        const newItem = await prisma.budgetItem.create({ data: { name, expectedAmount: expectedAmount || 0, budgetId } });
        res.status(201).json(newItem);
    } catch (error) { res.status(500).json({ error: 'Không thể tạo khoản mục.' }); }
});
router.put('/budget-items/:itemId', authMiddleware, async (req, res) => {
    const { itemId } = req.params;
    const { name, expectedAmount, actualAmount } = req.body;
    try {
        const updatedItem = await prisma.budgetItem.update({ where: { id: itemId }, data: { name, expectedAmount, actualAmount } });
        res.json(updatedItem);
    } catch (error) { res.status(500).json({ error: 'Không thể cập nhật khoản mục.' }); }
});
router.delete('/budget-items/:itemId', authMiddleware, async (req, res) => {
    const { itemId } = req.params;
    try {
        await prisma.budgetItem.delete({ where: { id: itemId } });
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: 'Không thể xóa khoản mục.' }); }
});

module.exports = router;
