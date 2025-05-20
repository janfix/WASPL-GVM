import Result from '../models/results.js';
import { analyzeResponsesWithAI } from '../utils/aiUtils.js';

/**
 * Calcule le score d'un résultat à l'aide d'une AI.
 * @param {string} resultId - ID du résultat
 * @returns {Promise<Object>} - Objet avec le score
 */
export const calculateScore = async (resultId) => {
  const result = await Result.findById(resultId).lean();
  if (!result) throw new Error('Résultat non trouvé.');

  // Analyse AI des réponses
  const score = await analyzeResponsesWithAI(result.responses);

  return { resultId, score };
};
