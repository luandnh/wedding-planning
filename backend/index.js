const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- Khởi tạo App ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Import Routes ---
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const budgetRoutes = require('./routes/budgets');
const taskRoutes = require('./routes/tasks');
const guestRoutes = require('./routes/guests');
const configRoutes = require('./routes/configs');
const mediaRoutes = require('./routes/media');
const noteRoutes = require('./routes/notes');
const dashboardRoutes = require('./routes/dashboard');
const memberRoutes = require('./routes/members');

// --- Sử dụng Routes ---
// Gắn các router vào với một tiền tố chung là /api
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
// Các routes cho budget và task đã có tiền tố trong file router của chúng
app.use('/api', budgetRoutes); 
app.use('/api', taskRoutes);
app.use('/api', guestRoutes);
app.use('/api', configRoutes);
app.use('/api', mediaRoutes);
app.use('/api', noteRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', memberRoutes);

// --- Server ---
app.listen(PORT, () => {
  console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
});
