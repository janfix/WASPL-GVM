<template>
    <div>
      <h2>Test Snapshot - Canvas Konva.js pur</h2>
  
      <div v-if="!snapshotTaken">
        <div id="snapshot-container" class="p-4 border" style="background: #f8f9fa;">
          <h3>Canvas Interactif Konva.js</h3>
  
          <div id="konva-container" style="border: 1px solid black; width: 600px; height: 400px;"></div>
  
        </div>
  
        <button class="btn btn-secondary mt-4" @click="moveRect">
          🎯 Déplacer le rectangle
        </button>
  
        <button class="btn btn-primary mt-4" @click="takeSnapshot">
          📸 Prendre Snapshot
        </button>
      </div>
  
      <div v-else>
        <h3>Snapshot généré :</h3>
        <img :src="snapshotSrc" style="width: 100%; height: auto;" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Konva from 'konva';
  import html2canvas from 'html2canvas';
  
  const snapshotTaken = ref(false);
  const snapshotSrc = ref(null);
  
  const stageWidth = 600;
  const stageHeight = 400;
  
  let stage;
  let layer;
  let rect;
  
  onMounted(() => {
    // Création du Stage
    stage = new Konva.Stage({
      container: 'konva-container',
      width: stageWidth,
      height: stageHeight,
    });
  
    // Création d'un Layer
    layer = new Konva.Layer();
    stage.add(layer);
  
    // Ajout d'un rectangle
    rect = new Konva.Rect({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: 'red',
      draggable: true,
    });
  
    layer.add(rect);
    layer.draw();
  });
  
  // Déplacer le rectangle aléatoirement
  function moveRect() {
    if (rect) {
      rect.x(Math.random() * (stageWidth - 100));
      rect.y(Math.random() * (stageHeight - 100));
      layer.batchDraw();
    }
  }
  
  // Prendre le snapshot du container
  async function takeSnapshot() {
    const container = document.getElementById('snapshot-container');
    if (!container) {
      console.error('Container not found');
      return;
    }
  
    const canvas = await html2canvas(container, {
      scrollY: -window.scrollY,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null, // respect du fond transparent
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight
    });
  
    snapshotSrc.value = canvas.toDataURL();
    snapshotTaken.value = true;
  }
  </script>
  
  <style scoped>
  #snapshot-container {
    background-color: #fff;
    padding: 20px;
    margin-top: 20px;
  }
  </style>
  