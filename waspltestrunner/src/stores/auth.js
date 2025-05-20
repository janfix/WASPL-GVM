import { defineStore } from 'pinia';
import api from '@/api'; // 📌 Import de l'instance Axios configurée
import axios from "axios";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),

  actions: {
    async login(email, password) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        console.log(API_BASE_URL)
        console.log("ZOZOZ")
        const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    
        // ✅ Décodage du token
        const decodedToken = JSON.parse(atob(response.data.token.split('.')[1]));
        console.log("🔍 Token décodé :", decodedToken);
    
        // ✅ Fusion des infos student + groupes depuis le token
        this.user = {
          ...response.data.student,      // les données venant de la BDD
          groups: decodedToken.groups,   // les groupes injectés dans le token
        };
    
        this.token = response.data.token;
        localStorage.setItem('token', response.data.token);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    
        return response.data;
      } catch (error) {
        console.error("❌ Erreur dans authStore.login :", error.response?.data || error.message);
        throw error;
      }
    }
    ,

    isAuthenticated() {
      return !!this.token;
    },

    checkToken() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const expDate = new Date(payload.exp * 1000);
  const now = new Date();

  if (now >= expDate) {
    console.warn("⚠️ Token expiré, l'utilisateur doit se reconnecter !");
    this.logout();
    return false;
  }
  return true;
},

logout(message = "Votre session a expiré. Merci de vous reconnecter.") {
  this.user = null;
  this.token = null;
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];

  // 🔔 Envoie un événement global (exploité dans App.vue par exemple)
  const toastEvent = new CustomEvent('show-toast', { detail: message });
  window.dispatchEvent(toastEvent);
}
  }
});
