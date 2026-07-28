import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // GitHub Pages: 自动适配仓库名作为 base 路径
  // 本地开发时用 '/', CI 构建时用 VITE_BASE_PATH
  base: process.env.VITE_BASE_PATH || '/',
  root: 'client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@lark-apaas/client-toolkit': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit'),
      '@lark-apaas/client-toolkit/logger': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/logger.ts'),
      '@lark-apaas/client-toolkit/utils/getAxiosForBackend': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/utils/getAxiosForBackend.ts'),
      '@lark-apaas/client-toolkit/antd-table': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/antd-table.tsx'),
      '@lark-apaas/client-toolkit/components': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/components'),
      '@lark-apaas/client-toolkit/hooks': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/hooks'),
      '@lark-apaas/client-toolkit/tools': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/tools'),
      '@lark-apaas/client-toolkit/dataloom': path.resolve(__dirname, '_shims/@lark-apaas/client-toolkit/dataloom.ts'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
});
