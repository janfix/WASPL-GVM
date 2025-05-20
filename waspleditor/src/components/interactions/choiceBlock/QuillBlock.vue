<template>
    <div ref="editor" class="quill-block"></div>
  </template>
  
  <script setup>
  import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
  import Quill from 'quill';
  
  const props = defineProps({
    modelValue: String
  });
  const emit = defineEmits(['update:modelValue']);
  
  const editor = ref(null);
  let quillInstance = null;
  
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video', 'formula'],
/*    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
     [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }], */
    [{ 'size': ['small', false, 'large', 'huge'] }],
/*     [{ 'header': [1, 2, 3, 4, 5, 6, false] }], */
    [{ 'color': [] }, { 'background': [] }],
  /*   [{ 'font': [] }], 
    [{ 'align': ['center', 'right', 'justify'] }],*/
    ['clean']
  ];
  
  onMounted(() => {
    quillInstance = new Quill(editor.value, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions
      }
    });
  
    quillInstance.root.innerHTML = props.modelValue || 'New choice';
  
    quillInstance.on('text-change', () => {
      emit('update:modelValue', quillInstance.root.innerHTML);
    });
  });
  
  onBeforeUnmount(() => {
    if (quillInstance) {
      quillInstance.off('text-change');
      quillInstance = null;
    }
  });
  
  watch(() => props.modelValue, (newVal) => {
    if (quillInstance && newVal !== quillInstance.root.innerHTML) {
      quillInstance.root.innerHTML = newVal || '';
    }
  });
  </script>
  
  <style scoped>
  .quill-block {
    min-height: 30px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }
  </style>