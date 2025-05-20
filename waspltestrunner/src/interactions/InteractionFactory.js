// src/components/interactions/interactionFactory.js

const interactionModules = import.meta.glob('./*Interaction.js', { eager: true });

const interactionMap = {};

for (const path in interactionModules) {
  const module = interactionModules[path];
  const match = path.match(/\.\/([a-zA-Z0-9]+)Interaction\.js$/);

  if (match) {
    const type = match[1]; // PascalCase
    const kebab = type.charAt(0).toLowerCase() + type.slice(1); // camelCase
    const ClassRef = module[`${type}Interaction`];
    if (ClassRef) {
      interactionMap[kebab] = ClassRef;
    }
  }
}

export function createInteraction(question, testData) {
  //console.log(question.el_Type)
  const InteractionClass = interactionMap[question.el_Type];
  if (!InteractionClass) {
    throw new Error(`Unknown interaction type: ${question.el_Type}`);
  }
  return new InteractionClass(question, testData);
}
