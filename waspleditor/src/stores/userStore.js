import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from "@/services/axios";
import { jwtDecode } from 'jwt-decode';

export const useUserStore = defineStore('user', () => {
  const user = ref({
    lastName: '',
    firstName: '',
    email: '',
    notification: false,
    language: 'English',
    role: 'Author',
    institution: '',
    subjects: [''],
    domains: [''],
    grades: [''],
    ISCED: '',
    reportOptions: '',
    AIConnectPrefs: {}
  });

  const userId = ref(null);
  const isAuthenticated = computed(() => !!user.value.email);

  const decodeToken = () => {
    const token = localStorage.getItem('editortoken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId.value = decoded.id || decoded.userId || null;
        console.log("🧬 Décodé userId :", userId.value);
      } catch (error) {
        console.error("❌ Erreur de décodage du token :", error);
        userId.value = null;
      }
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('editortoken');
      decodeToken();
      if (!userId.value) throw new Error("Aucun ID utilisateur trouvé dans le token");

      const response = await api.get(`/users/${userId.value}`);
      user.value = response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user:', error);
      user.value = null;
      userId.value = null;
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      const response = await api.put(`/users/${userId.value}`, updatedUser, {
        headers: { "Content-Type": "application/json" }
      });
      user.value = response.data;
    } catch (error) {
      console.error("❌ Failed to update user:", error);
    }
  };

  const logout = () => {
    user.value = null;
    userId.value = null;
    localStorage.removeItem('editortoken');
  };

  const loadUserOnInit = async (router) => {
    const token = localStorage.getItem('editortoken');
    if (token) {
      decodeToken();
      await fetchUser();
    } else {
      console.warn('⚠️ Aucun token trouvé lors de l\'init');
      user.value = null;
      userId.value = null;
      if (router) router.push('/login');
    }
  };

  return {
    user,
    userId,
    isAuthenticated,
    fetchUser,
    updateUser,
    logout,
    loadUserOnInit
  };
});
