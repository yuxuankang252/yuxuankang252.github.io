import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import markdownPlugin from './plugins/markdown.mjs'

// base: './' -> 资源使用相对路径，
// 这样同一份 dist 既能放在 https://<user>.github.io/<repo>/ 也能放在自定义域名根目录。
export default defineConfig({
  plugins: [markdownPlugin(), react()],
  base: './',
  build: {
    outDir: 'dist',
    // 单页：首页与博客在同一个 index.html 里用 hash 切换，播放器因此只挂载一次。
    // 旧的 blog.html 由 public/blog.html 兜底跳转。
    rollupOptions: {
      input: { main: resolve(process.cwd(), 'index.html') },
    },
  },
})
