// 📂 src/utils/snapshot.js
// Gestion des snapshots de pages dans WASPL

import html2canvas from 'html2canvas';
import { ref } from 'vue';

// 📦 Store local en mémoire (clé = pageIndex, valeur = dataURL)
const pageSnapshots = ref({});

/**
 * 🖊️ Prendre un snapshot de la div principale et l'associer à une page.
 * @param {Number} pageIndex - L'index de la page à capturer.
 */
export async function takeSnapshotForPage(pageIndex) {
  const container = document.querySelector('.pageContainer'); // Ton conteneur principal d'interactions
  if (!container) {
    console.warn('Container not found for snapshot.');
    return;
  }

  try {
    const canvas = await html2canvas(container, {
      scrollY: -window.scrollY,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight
    });

    const dataURL = canvas.toDataURL('image/png');
    pageSnapshots.value[pageIndex] = dataURL;
    console.log(`Snapshot pris pour la page ${pageIndex}`);
  } catch (error) {
    console.error('Erreur lors de la capture du snapshot :', error);
  }
}

/**
 * 🔍 Récupérer un snapshot d'une page si existant.
 * @param {Number} pageIndex - L'index de la page.
 * @returns {String|null} - L'URL de l'image snapshot ou null si absent.
 */
export function getSnapshotForPage(pageIndex) {
  return pageSnapshots.value[pageIndex] || null;
}