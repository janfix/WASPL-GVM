// src/utils/updateResults.js

/**
 * Met à jour les résultats avec une nouvelle correction AI.
 * @param {Ref} resultsRef - Référence à l'objet `results`
 * @param {string} axis - L'axe de correction
 * @param {Object} response - L'objet réponse retourné par l'IA
 * @param {number} score - Le score calculé
 */

export function updateResults(resultsRef, { axis, response, score, model }) {
    resultsRef.value.correction.push({
      axis,
      response,
      score
    });
  
    resultsRef.value.AImodel = model;
  }
  
  