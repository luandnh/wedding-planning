import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Xóa cookie token
  cookies.delete("token", { path: "/" });

  // Trả về một phản hồi JSON báo thành công
  return new Response(JSON.stringify({ success: true, message: "Đăng xuất thành công." }), {
    status: 200,
  });
};