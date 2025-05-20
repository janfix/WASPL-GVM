import axios from "axios";
import router from "@/router";
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

// 🔧 Prend en priorité la valeur de VITE_API_URL (Docker ou dev), sinon fallback local
console.log("🚣‍♂️", import.meta.env.VITE_API_URL?.replace(/\/+$/, ''))

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || "/testrunner/api";

console.log("🚣‍♂️", API_BASE_URL)


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔑 Injection automatique du token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔴 Gère automatiquement les expirations de token
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.warn("🔐 401 intercepté depuis :", error.config?.url);

      const authStore = useAuthStore();
      authStore.logout();

      router.push({ path: "/login", query: { reason: "expired" } });
    }
    return Promise.reject(error);
  }
);

export default api;
