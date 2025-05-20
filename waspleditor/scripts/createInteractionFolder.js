// scripts/createInteractionFolder.js
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Please provide an interaction name (camelCase)');
  process.exit(1);
}

const interactionName = args[0];
const pascalName = interactionName[0].toUpperCase() + interactionName.slice(1);

const baseDir = path.resolve(`src/components/interactions/${interactionName}`);
const interactionFile = path.resolve(`src/components/interactions/${pascalName}Interaction.js`);

if (fs.existsSync(baseDir)) {
  console.error(`❌ Directory ${baseDir} already exists`);
  process.exit(1);
}

fs.mkdirSync(baseDir, { recursive: true });

// Editor.vue
fs.writeFileSync(
  path.join(baseDir, 'Editor.vue'),
  `<template>
  <div>
    <h4>${pascalName} Editor</h4>
    <input v-model="localData.text" placeholder="Enter your content..." />
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
const localData = reactive({ ...props.modelValue });
watch(localData, () => emit('update:modelValue', localData));
</script>
`
);

// Preview.vue
fs.writeFileSync(
  path.join(baseDir, 'Preview.vue'),
  `<template>
  <div class="preview-box">
    <strong>${pascalName}:</strong> {{ modelValue.text }}
  </div>
</template>

<script setup>
defineProps(['modelValue']);
</script>
`
);

// model.json
fs.writeFileSync(
  path.join(baseDir, 'model.json'),
  JSON.stringify(
    {
      el_Type: interactionName,
      text: `This is a ${interactionName} interaction`
    },
    null,
    2
  )
);

// Interaction.js
fs.writeFileSync(
  interactionFile,
  `export class ${pascalName}Interaction {
  constructor(question, testData) {
    this.question = question;
    this.testData = testData;
  }

  get type() {
    return "${interactionName}";
  }

  get editor() {
    return () => import("./${interactionName}/Editor.vue");
  }

  get preview() {
    return () => import("./${interactionName}/Preview.vue");
  }

  get model() {
    return () => import("./${interactionName}/model.json");
  }
}
`
);

console.log(`✅ Interaction "${interactionName}" successfully created at: src/components/interactions/${interactionName}`);
