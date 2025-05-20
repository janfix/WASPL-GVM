// composables/useKonvaCanvas.js
import { ref } from 'vue'
import Konva from 'konva'
import europMap from '@/assets/europMap.png'
import { useTestStore } from '../../../../stores/testStore'

const store = useTestStore()

export function useKonvaCanvas(canvasRef, selectedElement, selectedZoneId, zones, externalSaveElement = null){
  const stage = ref(null)
  const zoneLayer = ref(null)
  const imageLayer = ref(null)
  const backgroundImage = ref(null)
  let drawZoneHandler = null
  let zoomLocked = ref(false)

  function registerDrawZone(fn) {
    drawZoneHandler = (zone) => {
      if (!zoneLayer.value || !stage.value) {
        console.warn('ZoneLayer ou Stage non initialisé, skip drawZone')
        return
      }
      fn(zone)
    }
  }

  function clearSelection() {
    // Désélectionner la zone
    selectedZoneId.value = null;
    
    // Trouver TOUS les transformers dans la couche
    const transformers = zoneLayer.value.find('Transformer');
    
    // Supprimer chaque transformer trouvé
    transformers.forEach(tr => {
      tr.detach(); // Détacher d'abord le nœud
      tr.destroy(); // Puis détruire le transformer
    });
    
    // Redessiner la couche
    zoneLayer.value.batchDraw();
  }

  async function initStage() {
    const imageObj = new window.Image();
  
    // 🔁 Charger l'image sauvegardée ou par défaut
    let imageSrc = europMap; // Image par défaut
    
    if (selectedElement.value?.el_Background) {
      // Si le chemin commence par http, c'est une URL complète
      if (selectedElement.value.el_Background.startsWith('http')) {
        imageSrc = selectedElement.value.el_Background;
      } else {
        // Sinon, construire l'URL complète
        imageSrc = `http://localhost:4000${selectedElement.value.el_Background.startsWith('/') ? '' : '/'}${selectedElement.value.el_Background}`;
      }
      console.log("Chargement de l'image sauvegardée:", imageSrc);
    }
  
    imageObj.src = imageSrc;
  
    imageObj.onload = () => {
      const savedSize = selectedElement.value?.el_CanvasSize;
  
      const defaultWidth = imageObj.width;
      const defaultHeight = imageObj.height;
  
      const stageWidth = savedSize?.width || defaultWidth;
      const stageHeight = savedSize?.height || defaultHeight;
  
      stage.value = new Konva.Stage({
        container: canvasRef.value,
        width: stageWidth,
        height: stageHeight,
      });
  
      imageLayer.value = new Konva.Layer();
      zoneLayer.value = new Konva.Layer();
  
      backgroundImage.value = new Konva.Image({
        image: imageObj,
        width: stageWidth,
        height: stageHeight,
        listening: true,
        name: 'backgroundImage',
      });
  
      backgroundImage.value.on('click', () => {
        clearSelection();
      });
  
      imageLayer.value.add(backgroundImage.value);
      stage.value.add(imageLayer.value);
      stage.value.add(zoneLayer.value);
  
      // gestion du zoom inchangé...
      stage.value.on('wheel', (e) => {
        if (zoomLocked.value) return;
        e.evt.preventDefault();
        const oldScale = stage.value.scaleX();
        const pointer = stage.value.getPointerPosition();
        const scaleBy = 1.05;
        const direction = e.evt.deltaY > 0 ? 1 : -1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
  
        const mousePointTo = {
          x: (pointer.x - stage.value.x()) / oldScale,
          y: (pointer.y - stage.value.y()) / oldScale,
        };
  
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
  
        stage.value.scale({ x: newScale, y: newScale });
        stage.value.position(newPos);
        stage.value.batchDraw();
      });
    };

    imageObj.onerror = () => {
      console.error("Erreur lors du chargement de l'image:", imageSrc);
      // Charger l'image par défaut en cas d'échec
      imageObj.src = europMap;
    };
  }
  
  function toggleZoomLock() {
    zoomLocked.value = !zoomLocked.value
  }
  
  function isZoomLocked() {
    return zoomLocked.value
  }

  function setBackgroundImage(imageDataUrl, relativePath) {
    console.log("Setting background image:", imageDataUrl, relativePath);
    
    // S'assurer que la scène et les couches sont initialisées
    if (!stage.value || !imageLayer.value) {
      console.error("Stage ou imageLayer non initialisé. Initialisation en cours...");
      initStage().then(() => {
        // Réessayer après l'initialisation
        setTimeout(() => setBackgroundImage(imageDataUrl, relativePath), 100);
      });
      return;
    }
    
    const imageObj = new window.Image();
  
    imageObj.onload = () => {
      const stageWidth = imageObj.width;
      const stageHeight = imageObj.height;
      
      // 🔁 Supprimer ancienne image si présente
      const oldBG = imageLayer.value.findOne('.backgroundImage');
      if (oldBG) oldBG.destroy();
  
      // 🔁 Redimensionner la scène Konva
      stage.value.width(stageWidth);
      stage.value.height(stageHeight);
  
      const konvaImage = new Konva.Image({
        image: imageObj,
        x: 0,
        y: 0,
        width: stageWidth,
        height: stageHeight,
        listening: true,
        name: 'backgroundImage',
      });

      konvaImage.on('click', () => {
        clearSelection();
      });
  
      imageLayer.value.add(konvaImage);
      imageLayer.value.draw();
      zoneLayer.value.draw(); // Redessine les zones
  
      // ✅ Mise à jour du modèle d'élément
      if (selectedElement.value) {
        // Stocker le chemin relatif, mais s'assurer qu'il commence par /
        selectedElement.value.el_Background = relativePath.startsWith('/') 
          ? relativePath 
          : `/${relativePath}`;
          
        selectedElement.value.el_CanvasSize = {
          width: stageWidth,
          height: stageHeight,
        };
        
        console.log("🧠 el_Background mis à jour :", selectedElement.value.el_Background);
        
        // Sauvegarder immédiatement l'élément
        store.updateElement({ ...selectedElement.value });
        
        // Appeler la fonction de sauvegarde externe si elle existe
        if (externalSaveElement && typeof externalSaveElement === 'function') {
          externalSaveElement();
        }
      }
    };
    
    imageObj.onerror = () => {
      console.error("❌ Erreur lors du chargement de l'image (imageObj.src =)", imageDataUrl);
    };
    
    imageObj.src = imageDataUrl;
  }

  function drawExistingZones(zonesInput) {
    if (!zoneLayer.value || !stage.value) return

    zoneLayer.value.find('.hotspotZone').forEach(zone => zone.destroy());
    zoneLayer.value.find('Transformer').forEach(tr => tr.destroy());

    if (drawZoneHandler && typeof drawZoneHandler === 'function') {
      zonesInput.forEach(zone => {
        try {
          drawZoneHandler(zone)
        } catch (err) {
          console.warn('❌ Erreur lors du rendu de la zone :', zone, err)
        }
      })
    }

    zoneLayer.value.draw()
  }

  function saveElement() {
    if (selectedElement.value) {
      const cleanZones = zones.value.map(zone => ({
        ...zone,
        message: undefined, // retirer ancien champ si jamais il reste
        name: zone.name || '', // toujours une string
        score: zone.score ?? 0 // fallback par défaut
      }));

      selectedElement.value.el_Data = JSON.parse(JSON.stringify(cleanZones));
      store.updateElement({ ...selectedElement.value })
    }
  }

  function deleteSelectedZone() {
    if (!selectedZoneId.value) return

    const index = zones.value.findIndex(z => z.id === selectedZoneId.value)

    if (index !== -1) {
      zones.value.splice(index, 1)

      const elDataIndex = selectedElement.value.el_Data.findIndex(z => z.id === selectedZoneId.value)
      if (elDataIndex !== -1) {
        selectedElement.value.el_Data.splice(elDataIndex, 1)
      }
    }

    selectedZoneId.value = null
    drawExistingZones(zones.value)
  }

  return {
    stage,
    zoneLayer,
    initStage,
    drawExistingZones,
    saveElement,
    deleteSelectedZone,
    registerDrawZone,
    setBackgroundImage,
    toggleZoomLock,
    isZoomLocked,
    clearSelection 
  }
}