// src/utils/updateLoadingMap.js

/**
 * Met à jour l'état de chargement pour une question spécifique
 * @param {Ref} mapRef - Référence à un objet de type { [questionId]: boolean }
 * @param {string} id - L'identifiant de la question
 * @param {boolean} state - L'état de chargement (true/false)
 */
export function updateLoadingMap(mapRef, id, state) {
    if (mapRef?.value) {
      mapRef.value[id] = state;
    }
  }
  