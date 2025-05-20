import { XMLParser } from 'fast-xml-parser';

export function convertQtiToWasplChoice(xmlString) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const qti = parser.parse(xmlString);
  const assessmentItem = qti.assessmentItem;
  const identifier = assessmentItem.identifier || 'QTI001';

  const correctValue = assessmentItem.responseDeclaration?.correctResponse?.value;
  const itemBody = assessmentItem.itemBody;
  const choiceInteraction = itemBody?.div?.div?.choiceInteraction;

  let promptText = '';
  let richText = '';
  
  if (typeof choiceInteraction.prompt === 'object') {
    const h1 = choiceInteraction.prompt.h1;
    if (typeof h1 === 'string') {
      promptText = h1;
      richText = `<h1>${h1}</h1>`;
    } else if (typeof h1 === 'object' && h1['#text']) {
      promptText = h1['#text'];
      richText = `<h1>${h1['#text']}</h1>`;
    }
  } else {
    promptText = choiceInteraction.prompt;
    richText = `<p>${choiceInteraction.prompt}</p>`;
  }

  const simpleChoices = Array.isArray(choiceInteraction.simpleChoice)
    ? choiceInteraction.simpleChoice
    : [choiceInteraction.simpleChoice];

  const options = simpleChoices.map((choice) => {
    const id = `${identifier}_${choice.identifier}`;
    const text = typeof choice === 'object' ? choice['#text'] || '' : choice;
    const isCorrect = choice.identifier === correctValue;
    return {
      id,
      text: text.trim(),
      isCorrect,
      weight: isCorrect ? 1 : 0
    };
  });

  return {
    el_ID: identifier,
    el_Label: 'Imported QTI Item',
    el_Type: 'choice',
    el_Text: promptText.trim(),
    el_RichText: richText,
    options,
    multiple: choiceInteraction.maxChoices !== '1',
    maxScore: 1,
    feedback: {
      correct: 'Correct',
      incorrect: 'Incorrect'
    },
    tip: 'some helpful hint',
    randomized: choiceInteraction.shuffle === 'true',
    isNewElement: true
  };
}
