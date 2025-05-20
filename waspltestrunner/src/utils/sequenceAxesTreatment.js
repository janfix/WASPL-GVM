// utils/sequenceAxesTreatment.js
import { askLMStudio } from './askLMStudio';

export async function SequenceAxesTreatment({
  elementData,
  answer,
  testData,
  updateResults,
  updateLoadingMap
}) {
  if (!elementData || !answer || !testData) return;

  const axes = elementData.correctionAxes || [];

  for (const axisObj of axes) {
    const prompt = `you are a ${testData.Subject} teacher in ${testData.level},
Here is the question asked to the students:
${answer.questionLabel}
Here is the student's answer:
${answer.selectedOptions.trim()}
Can you say if ${axisObj.axis} is addressed?
Format your answer in strict JSON. The JSON must include:
{
  "answer": true/false,
  "score": 0-10,
  "comment": "Your comment here"
}
⚠️ Respond with ONLY the JSON. No explanations, no markdown, no commentary.`;

    await askLMStudio({
      prompt,
      currentAxis: axisObj.axis,
      elID: elementData.el_ID,
      updateResults,
      updateLoadingMap
    });
  }
}
