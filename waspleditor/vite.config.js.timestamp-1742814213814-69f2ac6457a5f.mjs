// vite.config.js
import { defineConfig } from "file:///app/node_modules/vite/dist/node/index.js";
import vue from "file:///app/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/app";
var vite_config_default = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
      // Alias pour le dossier src
    }
  },
  server: {
    host: "0.0.0.0",
    // Permet d'accéder au frontend depuis l'extérieur du conteneur
    port: 5173,
    // Port du frontend
    strictPort: true,
    // Force l'utilisation du port 5173
    watch: {
      usePolling: true
      // Nécessaire pour Docker sous Windows/macOS
    },
    proxy: {
      // Redirige toutes les requêtes /api vers le backend
      "/api": {
        //target: 'http://waspl-editor:4000',
        target: "http://localhost:4000",
        // URL du backend dans le réseau Docker
        changeOrigin: true,
        // Nécessaire pour les requêtes cross-origin
        rewrite: (path2) => path2.replace(/^\/api/, "")
        // Supprime le préfixe /api
      }
    }
  },
  build: {
    outDir: "dist",
    // Dossier de sortie pour la build
    sourcemap: true
    // Active les sourcemaps en production
  },
  optimizeDeps: {
    include: ["tabulator-tables"]
    // Optimise les dépendances
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFt2dWUoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSwgLy8gQWxpYXMgcG91ciBsZSBkb3NzaWVyIHNyY1xuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLCAvLyBQZXJtZXQgZCdhY2NcdTAwRTlkZXIgYXUgZnJvbnRlbmQgZGVwdWlzIGwnZXh0XHUwMEU5cmlldXIgZHUgY29udGVuZXVyXG4gICAgcG9ydDogNTE3MywgLy8gUG9ydCBkdSBmcm9udGVuZFxuICAgIHN0cmljdFBvcnQ6IHRydWUsIC8vIEZvcmNlIGwndXRpbGlzYXRpb24gZHUgcG9ydCA1MTczXG4gICAgd2F0Y2g6IHtcbiAgICAgIHVzZVBvbGxpbmc6IHRydWUsIC8vIE5cdTAwRTljZXNzYWlyZSBwb3VyIERvY2tlciBzb3VzIFdpbmRvd3MvbWFjT1NcbiAgICB9LFxuICAgIHByb3h5OiB7XG4gICAgICAvLyBSZWRpcmlnZSB0b3V0ZXMgbGVzIHJlcXVcdTAwRUF0ZXMgL2FwaSB2ZXJzIGxlIGJhY2tlbmRcbiAgICAgICcvYXBpJzoge1xuICAgICAgICAvL3RhcmdldDogJ2h0dHA6Ly93YXNwbC1lZGl0b3I6NDAwMCcsXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcsIC8vIFVSTCBkdSBiYWNrZW5kIGRhbnMgbGUgclx1MDBFOXNlYXUgRG9ja2VyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSwgLy8gTlx1MDBFOWNlc3NhaXJlIHBvdXIgbGVzIHJlcXVcdTAwRUF0ZXMgY3Jvc3Mtb3JpZ2luXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksIC8vIFN1cHByaW1lIGxlIHByXHUwMEU5Zml4ZSAvYXBpXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIiwgLy8gRG9zc2llciBkZSBzb3J0aWUgcG91ciBsYSBidWlsZFxuICAgIHNvdXJjZW1hcDogdHJ1ZSwgLy8gQWN0aXZlIGxlcyBzb3VyY2VtYXBzIGVuIHByb2R1Y3Rpb25cbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWyd0YWJ1bGF0b3ItdGFibGVzJ10sIC8vIE9wdGltaXNlIGxlcyBkXHUwMEU5cGVuZGFuY2VzXG4gIH0sXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQThMLFNBQVMsb0JBQW9CO0FBQzNOLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLElBQUksQ0FBQztBQUFBLEVBQ2YsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sWUFBWTtBQUFBO0FBQUEsSUFDWixPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUE7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUE7QUFBQSxNQUVMLFFBQVE7QUFBQTtBQUFBLFFBRU4sUUFBUTtBQUFBO0FBQUEsUUFDUixjQUFjO0FBQUE7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsRUFBRTtBQUFBO0FBQUEsTUFDOUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBO0FBQUEsSUFDUixXQUFXO0FBQUE7QUFBQSxFQUNiO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsa0JBQWtCO0FBQUE7QUFBQSxFQUM5QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
