import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: env.VITE_BASE_URL || '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
      watch: {
        usePolling: true,
      },
/*       proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
        '/wiki': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      }, */
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    optimizeDeps: {
      include: ['tabulator-tables'],
    },
  };
});
