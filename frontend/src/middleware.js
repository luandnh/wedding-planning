// src/middleware.js
import { defineMiddleware } from 'astro:middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = import.meta.env.JWT_SECRET || 'default-secret-key';

// Middleware này sẽ chạy trước mỗi yêu cầu đến server
export const onRequest = defineMiddleware(async (context, next) => {
    // --- SỬA LỖI: Bỏ qua tất cả các API routes ---
    // Middleware chỉ nên bảo vệ các trang (pages), không phải các điểm cuối API.
    if (context.url.pathname.startsWith('/api/')) {
        return next(); // Cho phép request đi thẳng đến file API
    }

    const token = context.cookies.get('token')?.value;
    const isProtectedRoute = context.url.pathname.startsWith('/dashboard') ||
                             context.url.pathname.startsWith('/budget') ||
                             context.url.pathname.startsWith('/tasks') ||
                             context.url.pathname.startsWith('/guests') ||
                             context.url.pathname.startsWith('/notes') ||
                             context.url.pathname.startsWith('/config');

    // Nếu không có token và truy cập trang cần bảo vệ -> chuyển về trang login
    if (isProtectedRoute && !token) {
        return context.redirect('/login');
    }

    // Nếu có token, giải mã và gắn thông tin user vào context
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            context.locals.user = decoded;
        } catch (error) {
            // Nếu token lỗi, xóa cookie và coi như chưa đăng nhập
            context.cookies.delete('token', { path: '/' });
            context.locals.user = null;
            if (isProtectedRoute) {
                return context.redirect('/login');
            }
        }
    }

    // Nếu đã đăng nhập mà vào trang login -> chuyển về dashboard
    if (context.url.pathname === '/login' && context.locals.user) {
        return context.redirect('/dashboard');
    }
    
    // Cho phép request đi tiếp
    return next();
});
