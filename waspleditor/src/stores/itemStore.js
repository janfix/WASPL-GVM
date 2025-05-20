import { defineStore } from "pinia";
import api from "@/services/axios";



export const useItemStore = defineStore("item", {
  state: () => ({
    selectedElement: null,
    elements: [], // Optionnel : cache local si besoin
  }),

  actions: {
    setActiveItem(item) {
      this.selectedElement = item;
    },

    resetState() {
      this.selectedElement = null;
    },

    async saveItem(item, ELmetadata) {
      try {
        // 🔁 Fusionner les métadonnées dans l'objet envoyé
        const itemToSend = {
          ...item,
          metadata: {
            ...(item.metadata || {}),
            ...ELmetadata
          }
        }
    
        const res = await api.post(`/items`, itemToSend)
    
        console.log("✅ Item enregistré :", res.data)
        console.log("✅ Metadata sauvegardées :", res.data.metadata)
    
        return res.data
      } catch (err) {
        console.error("❌ Erreur lors de la sauvegarde de l'item :", err)
        throw err
      }
    },

    async updateItem(id, updatedData) {
      try {
        const res = await api.put(`/items/${id}`, updatedData);
        console.log(`🔄 Item mis à jour (ID: ${id}) :`, res.data);
        return res.data;
      } catch (err) {
        console.error(`❌ Erreur mise à jour item ${id} :`, err);
        throw err;
      }
    },

    async deleteItem(id) {
      try {
        await api.delete(`/items/${id}`);
        console.log(`🗑️ Item supprimé (ID: ${id})`);
      } catch (err) {
        console.error(`❌ Erreur suppression item ${id} :`, err);
        throw err;
      }
    },
  },

  getters: {
    hasSelected: (state) => !!state.selectedElement,
    selectedLabel: (state) => state.selectedElement?.el_Label || "Aucun item sélectionné",
  },
});
