import { defineMiddleware } from "astro:middleware";
import jwt from "jsonwebtoken";

const JWT_SECRET = import.meta.env.JWT_SECRET || "default-secret-key";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith("/api/")) {
    return next();
  }

  const token = context.cookies.get("token")?.value;
  const isProtectedRoute = !["/login", "/select-workspace"].some((p) =>
    context.url.pathname.startsWith(p)
  );

  try {
    if (token) {
      context.locals.user = jwt.verify(token, JWT_SECRET);
    }
  } catch {
    context.cookies.delete("token", { path: "/" });
    context.locals.user = null;
  }

  const user = context.locals.user;

  if (!user && isProtectedRoute) {
    return context.redirect("/login");
  }

  if (user && context.url.pathname.startsWith("/login")) {
    return context.redirect("/select-workspace");
  }

  // Logic mới: Nếu đã đăng nhập nhưng vào trang cần workspace mà chưa chọn -> về trang chọn
  const workspaceId = context.cookies.get("currentWorkspaceId")?.value; // Giả sử lưu vào cookie
  if (user && isProtectedRoute && !workspaceId) {
    // Tạm thời chúng ta dùng localStorage ở client, nên logic này sẽ được xử lý ở client
    // Nếu sau này chuyển sang cookie, logic này sẽ hữu ích.
  }

  return next();
});
