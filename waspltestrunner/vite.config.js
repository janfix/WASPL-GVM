import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const isProd = mode === "production";
  // En production, l'application sera servie à la racine du serveur
  //const baseUrl = isProd ? '/' : (env.VITE_BASE_URL || '/');
   const baseUrl = env.VITE_BASE_URL || '/';


  console.log("🔧 Chargement des variables VITE:");
  console.log("🔧 VITE_BASE_URL =", baseUrl);
  console.log("🔧 VITE_API_URL =", env.VITE_API_URL);

  return {
    //base: baseUrl,
    base: env.VITE_BASE_URL || '/testrunner/',
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_PORT) || 5174,
      strictPort: true,
      watch: {
        usePolling: true,
      },
      proxy: isProd ? {} : {
        "/api": {
          target: "http://localhost:3011",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: isProd ? false : true,
    },
    optimizeDeps: {
      include: ["tabulator-tables"],
    },
  };});