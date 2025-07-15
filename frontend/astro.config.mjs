import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from "@tailwindcss/vite";
import node from '@astrojs/node';
import AstroPWA from '@vite-pwa/astro'

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    svelte(),
    AstroPWA({
      registerType: 'autoUpdate', // Tự động cập nhật service worker khi có phiên bản mới
      manifest: {
        name: 'WeddingPlan - Kế Hoạch Cưới',
        short_name: 'WeddingPlan',
        description: 'Ứng dụng quản lý và lên kế hoạch đám cưới của bạn.',
        theme_color: '#ec4899', // Màu của thanh công cụ trên mobile
        background_color: '#fdf2f8', // Màu nền khi splash screen hiện ra
        display: 'standalone',
        scope: '/',
        start_url: '/dashboard', // Trang bắt đầu khi mở app từ màn hình chính
        icons: [
          // Tham chiếu đến các icon bạn đã có trong thư mục public/favicon
          {
            src: '/favicon/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/favicon/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon',
          },
          {
            src: '/favicon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'], // Các file cần được cache để chạy offline
        navigateFallback: '/offline', // (Tùy chọn) Trang hiển thị khi mất mạng và không có trong cache
      }
    })
  ]
});