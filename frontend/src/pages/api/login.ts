export const prerender = false;
import type { APIRoute } from "astro";

// API này sẽ nhận yêu cầu từ form đăng nhập
export const POST: APIRoute = async ({ request, cookies }) => {
  if (request.headers.get("Content-Type") === "application/json") {
    const { email, password } = await request.json();
    console.log("Đăng nhập với email:", email);
    const backendUrl =
      import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:3001";

    try {
      // Bước 1: Chuyển tiếp yêu cầu xác thực đến backend Node.js
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Nếu backend trả về lỗi, gửi lại lỗi đó cho client
        return new Response(
          JSON.stringify({ error: data.error || "Đăng nhập thất bại" }),
          { status: response.status }
        );
      }

      // Bước 2: Nhận token từ backend và thiết lập cookie an toàn
      // HttpOnly: true -> JavaScript ở client không thể đọc được cookie này
      cookies.set("token", data.token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD, // Chỉ gửi qua HTTPS ở môi trường production
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
        sameSite: "lax",
      });

      // Bước 3: Trả về thông báo thành công cho client
      return new Response(JSON.stringify({ success: true, user: data.user }), {
        status: 200,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Lỗi kết nối đến server xác thực." }),
        { status: 500 }
      );
    }
  } else {
    return new Response(
      JSON.stringify({
        error: "Yêu cầu không hợp lệ. Vui lòng gửi dữ liệu dưới dạng JSON.",
      }),
      { status: 400 }
    );
  }
};
