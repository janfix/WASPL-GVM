// composables/useKonvaCanvas.js
import { ref } from 'vue'
import Konva from 'konva'
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

  // Récupérer l'URL de base du serveur pour les images (ex: http://localhost:4000 ou https://monappli.com)
  let BASE_URL = import.meta.env.VITE_FRONTEND_URL;
  const editorURL = import.meta.env.VITE_BASE_URL;

  const Docker_On = import.meta.env.VITE_DOCKER_ON; 
  console.log(Docker_On)

 let imageSrc = "media/europe.png"; 

  if(Docker_On == "istrue"){
    BASE_URL = window.location.origin   
    console.log(BASE_URL)
    console.log(import.meta.env.VITE_API_BASE_URL)
    console.log(selectedElement.value?.el_Background)
    if(selectedElement.value?.el_Background){
        imageSrc = BASE_URL+selectedElement.value?.el_Background
    } else{
        imageSrc = `${BASE_URL}:4000/media/europe.png`
    }
  } else{
    console.log("NOT DOCKER")
     imageSrc =  selectedElement.value?.el_Background || `${BASE_URL}/media/europe.png`;
  }

  console.log("Chargement de l'image de fond par defaut:", imageSrc);

  imageObj.src = imageSrc;

  imageObj.onload = () => {
    // Largeur/hauteur récupérée ou forcée
    const savedSize = selectedElement.value?.el_CanvasSize;
    const stageWidth = savedSize?.width || imageObj.width;
    const stageHeight = savedSize?.height || imageObj.height;

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

    backgroundImage.value.on('click', clearSelection);

    imageLayer.value.add(backgroundImage.value);
    stage.value.add(imageLayer.value);
    stage.value.add(zoneLayer.value);

    // Gestion du zoom (inchangé)
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
    // Éventuel fallback sur une image locale embarquée (à définir)
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

    // ✅ Mise à jour du modèle d'élément (ici on ne stocke QUE le chemin relatif)
    if (selectedElement.value) {
      // Toujours stocker le chemin RELATIF (/media/xxx.jpg)
      selectedElement.value.el_Background =
        relativePath.startsWith('/')
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

  // On affiche en local (Konva) l'URL absolue si besoin pour dev, mais on stocke TOUJOURS le chemin relatif côté données
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