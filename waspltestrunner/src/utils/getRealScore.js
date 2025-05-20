export function getRealScore(axis, answerValue, element, memoAxis, partialScoreRef, totalQScoreRef) {
    if (!element || !element.correctionAxes) {
      console.warn(`Élément non trouvé ou sans correctionAxes`);
      return null;
    }
  
    if (memoAxis.includes(axis)) return;
  
    const correction = element.correctionAxes.find(corr => corr.axis === axis);
    if (!correction) {
      console.warn(`Axe "${axis}" non trouvé dans l'élément`);
      return null;
    }
  
    const score = answerValue ? Number(correction.point) : -Number(correction.penalty);
    partialScoreRef.value.push(score);
    memoAxis.push(axis);
  
    totalQScoreRef.value = partialScoreRef.value.reduce((sum, s) => sum + s, 0);
    console.log(`✅ Score pour ${axis} : ${score} — TotalQScore: ${totalQScoreRef.value}`);
  
    return score;
  }
  