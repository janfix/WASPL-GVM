<script setup>
import { ref, computed } from 'vue';

export const useScoreCalculation = () => {
    // Stockage des scores par questionId et axis
    const scoresByQuestion = ref(new Map());
    
    // Fonction pour mettre à jour un score
    const updateScore = (questionId, axis, score) => {
        if (!scoresByQuestion.value.has(questionId)) {
            scoresByQuestion.value.set(questionId, new Map());
        }
        scoresByQuestion.value.get(questionId).set(axis, score);
    };
    
    // Score total calculé
    const totalScore = computed(() => {
        let total = 0;
        for (const axisScores of scoresByQuestion.value.values()) {
            for (const score of axisScores.values()) {
                total += score;
            }
        }
        return total;
    });

    // Fonction pour obtenir le score réel
    const getRealScore = (element, axis, AICorr) => {
        if (!element?.correctionAxes) {
            console.warn(`Element invalide ou ne contient pas de correctionAxes`);
            return null;
        }

        const correction = element.correctionAxes.find(corr => corr.axis === axis);
        if (!correction) {
            console.warn(`Axe "${axis}" non trouvé`);
            return null;
        }

        const score = AICorr ? Number(correction.point) : -Number(correction.penalty);
        if (!isNaN(score)) {
            updateScore(element.el_ID, axis, score);
        }
        return score;
    };

    return {
        totalScore,
        getRealScore,
        scoresByQuestion
    };
};
</script>