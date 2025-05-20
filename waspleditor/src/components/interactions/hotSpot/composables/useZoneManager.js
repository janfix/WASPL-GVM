// composables/useZoneManager.js
import Konva from "konva";
import { nanoid } from "nanoid";

export function useZoneManager(
  stageRef,
  zoneLayerRef,
  selectedZoneId,
  saveElement,
  zones,
  stickerZoneRef
) {
  let currentTransformer = null;
  let polygonPoints = [];
  let polygonLine = null;
  let anchors = [];



  function drawZone(zone) {
   /*  console.log(
      "🟢 [drawZone] Zone à dessiner :",
      JSON.parse(JSON.stringify(zone))
    ); */

    if (!stageRef.value || !zoneLayerRef.value || !zone) {
      console.warn("❌ drawZone abort: stage, zoneLayer ou zone invalide");
      return;
    }

    // Déterminer automatiquement le type si non spécifié
    if (!zone.type) {
      if ("radius" in zone) zone.type = "circle";
      else if ("width" in zone && "height" in zone) zone.type = "rect";
      else if ("points" in zone) zone.type = "freeform";
      else {
        console.warn("❌ Impossible d'inférer le type de zone :", zone);
        return;
      }
    }

    // Propriétés communes à toutes les formes
    const commonProps = {
      fill: "rgba(0,123,255,0.3)",
      stroke: "blue",
      strokeWidth: 2,
      draggable: true,
      id: zone.id,
    };

    // Ajouter la fonction de contrainte de déplacement pour le cercle et le rectangle
    if (zone.type === "circle" || zone.type === "rect") {
      commonProps.dragBoundFunc = function (pos) {
        const width = stageRef.value.width();
        const height = stageRef.value.height();

        if (zone.type === "circle") {
          const r = this.radius();
          return {
            x: Math.max(r, Math.min(pos.x, width - r)),
            y: Math.max(r, Math.min(pos.y, height - r)),
          };
        } else if (zone.type === "rect") {
          const w = this.width();
          const h = this.height();
          return {
            x: Math.max(0, Math.min(pos.x, width - w)),
            y: Math.max(0, Math.min(pos.y, height - h)),
          };
        }
        return pos;
      };
    }

    // Créer la forme selon son type
    let shape;
    switch (zone.type) {
      case "circle":
        shape = new Konva.Circle({
          ...commonProps,
          x: zone.x || 0,
          y: zone.y || 0,
          radius: zone.radius || 40,
          name: "hotspotZone",
        });
        break;

      case "rect":
        shape = new Konva.Rect({
          ...commonProps,
          x: zone.x || 0,
          y: zone.y || 0,
          width: zone.width || 80,
          height: zone.height || 80,
          name: "hotspotZone",
        });
        break;

      case "freeform":
        shape = new Konva.Line({
          ...commonProps,
          points: zone.points || [],
          closed: true,
          x: zone.x || 0,
          y: zone.y || 0,
          name: "hotspotZone",
        });
        break;

      default:
        console.warn("❌ Type de zone non pris en charge :", zone.type);
        return;
    }

    // Gérer les événements de clic pour la sélection
    shape.on("click", (e) => {
      e.cancelBubble = true;

      // Supprimer les transformers existants
      zoneLayerRef.value.find("Transformer").forEach((tr) => tr.destroy());

      // Créer un nouveau transformer adapté au type de forme
      const tr = new Konva.Transformer({
        nodes: [shape],
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
        boundBoxFunc: (oldBox, newBox) => {
          // Empêcher les formes trop petites
          if (newBox.width < 10 || newBox.height < 10) return oldBox;
          return newBox;
        },
      });

      zoneLayerRef.value.add(tr);
      currentTransformer = tr;
      selectedZoneId.value = zone.id;
      zoneLayerRef.value.draw();
    });

    // Gérer les événements de fin de déplacement
    shape.on("dragend", () => {
      const pos = shape.position();
      zone.x = pos.x;
      zone.y = pos.y;
      saveElement();
    });

    // Gérer les événements de fin de transformation
    shape.on("transformend", () => {
      if (zone.type === "circle") {
        // Pour les cercles, mettre à jour le rayon en tenant compte de l'échelle
        const scale = shape.scaleX();
        shape.radius(shape.radius() * scale);
        shape.scale({ x: 1, y: 1 });
        zone.radius = shape.radius();
      } else if (zone.type === "rect") {
        // Pour les rectangles, mettre à jour les dimensions en tenant compte de l'échelle
        const scaleX = shape.scaleX();
        const scaleY = shape.scaleY();
        shape.width(shape.width() * scaleX);
        shape.height(shape.height() * scaleY);
        shape.scale({ x: 1, y: 1 });
        zone.width = shape.width();
        zone.height = shape.height();
      } else if (zone.type === "freeform") {
        // Pour les formes libres, nous devons mettre à jour les points
        // Cette partie est plus complexe et nécessite un traitement spécial
        // qui pourrait être développé selon vos besoins exacts
        const scaleX = shape.scaleX();
        const scaleY = shape.scaleY();

        // Recalculer les points en tenant compte de l'échelle
        const newPoints = [];
        for (let i = 0; i < zone.points.length; i += 2) {
          newPoints.push(zone.points[i] * scaleX);
          newPoints.push(zone.points[i + 1] * scaleY);
        }

        shape.points(newPoints);
        shape.scale({ x: 1, y: 1 });
        updateZonePoints(zone.id, newPoints);
        //zone.points = newPoints
      }

      // Sauvegarder les modifications
      saveElement();
    });
    // Ajouter la forme à la couche et la dessiner
    zoneLayerRef.value.add(shape);
    
  }

  function drawNewZone(type, x, y) {
  const id = nanoid(6);

  const zone = {
    id,
    type,
    x,
    y,
    ...(type === "circle"
      ? { radius: 40 }
      : type === "rect"
      ? { width: 80, height: 80 }
      : { points: [], x: 0, y: 0 }),
    name: "",
    score: 1,
  };

  zones.value.push(zone);
  drawZone(zone);
  saveElement();

  return id;
}



  function addZone(type) {
    const id = nanoid(6);
    const zone = {
      id,
      type,
      x: 100,
      y: 100,
      ...(type === "circle" ? { radius: 40 } : { width: 80, height: 80 }),
      name: "",
      score: 1,
      emoji:"🎯"
    };
    zones.value.push(zone);
    drawZone(zone);
    saveElement();
  }

  function startFreeform() {
    polygonPoints = [];
    anchors.forEach((a) => a.destroy());
    anchors = [];
    polygonLine = new Konva.Line({
      points: [],
      stroke: "orange",
      strokeWidth: 2,
      lineJoin: "round",
    });
    zoneLayerRef.value.add(polygonLine);
    zoneLayerRef.value.draw();

    stageRef.value.on("mousedown.freeform", (e) => {
      const pointer = stageRef.value.getPointerPosition();
      const point = { x: pointer.x, y: pointer.y };

      if (polygonPoints.length > 2) {
        const dx = point.x - polygonPoints[0].x;
        const dy = point.y - polygonPoints[0].y;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
          completePolygon();
          return;
        }
      }

      polygonPoints.push(point);
      updateFreeformLine();
      drawAnchor(point);
    });
  }

  function updateFreeformLine() {
    const flat = polygonPoints.flatMap((p) => [p.x, p.y]);
    polygonLine.points(flat);
    zoneLayerRef.value.batchDraw();
  }

  function drawAnchor(point) {
    const anchor = new Konva.Circle({
      x: point.x,
      y: point.y,
      radius: 5,
      fill: polygonPoints.length === 1 ? "orange" : "black",
    });
    anchors.push(anchor);
    zoneLayerRef.value.add(anchor);
    zoneLayerRef.value.draw();
  }

  function updateZonePoints(zoneId, newPoints) {
    // Trouver la zone par son ID
    const zone = zones.value.find((z) => z.id === zoneId);

    if (zone && zone.type === "freeform" && newPoints) {
      // Mettre à jour les points de la zone
      zone.points = [...newPoints];

      // Sauvegarder les modifications
      saveElement();

      return true;
    }

    return false;
  }

  function completePolygon() {
    // Vérifier qu'il y a suffisamment de points pour former un polygone
    if (polygonPoints.length < 3) {
      console.warn("❌ Pas assez de points pour créer un polygone");
      cleanupFreeformDrawing();
      return;
    }

    // Générer un ID unique pour la nouvelle zone
    const id = nanoid(6);

    // Convertir les objets points en tableau plat pour Konva
    const points = polygonPoints.flatMap((p) => [p.x, p.y]);

    // Créer l'objet zone
    const zone = {
      id,
      type: "freeform",
      points,
      x: 0, // Position à 0 car les points contiennent déjà les coordonnées absolues
      y: 0,
    };

    // Ajouter la zone à la liste des zones
    zones.value.push(zone);

    // Créer la forme polygone
    const polygon = new Konva.Line({
      points,
      fill: "rgba(0,123,255,0.3)",
      stroke: "blue",
      strokeWidth: 2,
      closed: true,
      draggable: true,
      id: zone.id,
    });

    // Ajouter les gestionnaires d'événements à la forme

    // Gestion du clic pour la sélection
    polygon.on("click", (e) => {
      e.cancelBubble = true;

      // Supprimer les transformers existants
      zoneLayerRef.value.find("Transformer").forEach((tr) => tr.destroy());

      // Créer un nouveau transformer pour cette forme
      const tr = new Konva.Transformer({
        node: polygon,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
        boundBoxFunc: (oldBox, newBox) => {
          // Empêcher les formes trop petites
          if (newBox.width < 10 || newBox.height < 10) return oldBox;
          return newBox;
        },
      });

      zoneLayerRef.value.add(tr);
      currentTransformer = tr;
      selectedZoneId.value = id;
      zoneLayerRef.value.draw();
    });

    // Gestion du déplacement
    polygon.on("dragend", () => {
      const pos = polygon.position();
      zone.x = pos.x;
      zone.y = pos.y;
      saveElement();
    });

    // Gestion de la transformation
    polygon.on("transformend", () => {
      const scaleX = polygon.scaleX();
      const scaleY = polygon.scaleY();

      // Mettre à jour les points en tenant compte de l'échelle
      const newPoints = [];
      for (let i = 0; i < zone.points.length; i += 2) {
        newPoints.push(zone.points[i] * scaleX);
        newPoints.push(zone.points[i + 1] * scaleY);
      }

      polygon.points(newPoints);
      polygon.scale({ x: 1, y: 1 });
      updateZonePoints(zone.id, newPoints);
      //zone.points = newPoints

      saveElement();
    });

    // Ajouter la forme au layer et la dessiner
    zoneLayerRef.value.add(polygon);
    zoneLayerRef.value.draw();

    // Nettoyer le processus de dessin de forme libre
    cleanupFreeformDrawing();

    // Sauvegarder les modifications
    saveElement();
  }

  // Fonction auxiliaire pour nettoyer les éléments de dessin
  function cleanupFreeformDrawing() {
    // Supprimer la ligne de construction
    if (polygonLine) {
      polygonLine.destroy();
      polygonLine = null;
    }

    // Supprimer tous les points d'ancrage
    anchors.forEach((a) => a.destroy());
    anchors = [];

    // Réinitialiser le tableau de points
    polygonPoints = [];

    // Supprimer les gestionnaires d'événements
    if (stageRef.value) {
      stageRef.value.off("mousedown.freeform");
      stageRef.value.off("mousemove.freeform");
    }

    // Rafraîchir l'affichage
    if (zoneLayerRef.value) {
      zoneLayerRef.value.batchDraw();
    }
  }

  function clearSelection() {
    if (selectedZoneId.value) {
      selectedZoneId.value = null;
      // Si tu utilises des transformers (poignées Konva), pense à les retirer ici aussi :
      const transformer = zoneLayer.value.findOne(".transformer");
      if (transformer) transformer.destroy();
      zoneLayer.value.draw();
    }
  }

  return {
    drawZone,
    drawNewZone,
    addZone,
    startFreeform,
    completePolygon,
    useZoneManager,
    clearSelection,
  };
}
