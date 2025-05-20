import axios from "axios";
import router from "@/router";
import { useUserStore } from "@/stores/userStore";

// 🔁 Détection de l'environnement
const isProd = import.meta.env.MODE === "production";

// 🔧 Base dynamique
const baseURL = import.meta.env.VITE_API_BASE_URL;

// 🛠️ Instance Axios configurée
const api = axios.create({
  baseURL,
  withCredentials: true,
});

// ➕ Intercepteur : ajoute le token
api.interceptors.request.use(config => {
  const token = localStorage.getItem("editortoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⚠️ Intercepteur : gère les erreurs d’auth
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && [401, 403].includes(error.response.status)) {
      console.warn("🔐 Token invalide ou expiré");
      localStorage.removeItem("editortoken");

      try {
        const userStore = useUserStore();
        if (userStore.logout) userStore.logout();
      } catch (e) {
        console.warn("⚠️ Impossible d'appeler logout depuis ce contexte");
      }

      const currentRouteName = router.currentRoute?.value?.name;
      if (currentRouteName !== "login") {
        router.push({ name: "login" }).catch(() => {});
      }
    }

    return Promise.reject(error);
  }
);

export default api;
