// routes/media.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('../generated/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Cấu hình nơi lưu trữ file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const workspaceId = req.params.workspaceId;
        const uploadPath = path.join('public', 'uploads', workspaceId);
        fs.mkdirSync(uploadPath, { recursive: true }); // Tự động tạo thư mục nếu chưa có
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// API để upload một file media
router.post('/workspaces/:workspaceId/upload', authMiddleware, upload.single('file'), async (req, res) => {
    const { workspaceId } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: 'Không có file nào được tải lên.' });
    }

    try {
        // Tạo đường dẫn URL để truy cập file
        const fileUrl = `/uploads/${workspaceId}/${req.file.filename}`;

        const newMedia = await prisma.media.create({
            data: {
                url: fileUrl,
                type: req.file.mimetype,
                workspaceId: workspaceId,
            }
        });
        res.status(201).json(newMedia);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Không thể lưu thông tin file.' });
    }
});

module.exports = router;
