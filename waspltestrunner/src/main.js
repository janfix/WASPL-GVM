import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import './style.css';

// Import Bootstrap CSS and JS
// HERE IS THE MAIN OF TESTRUNNER !
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";
console.log("From Main.js")
console.log("🔍 ENV VITE_API_URL =", import.meta.env.VITE_API_URL);
window.bootstrap = bootstrap;

try {
  console.log("🔧 Initialisation de l'app Vue...");

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.mount('#app');

  console.log("✅ App Vue montée !");

  document.querySelectorAll('.accordion').forEach(accordion => {
    const accordionItems = accordion.querySelectorAll('.accordion-collapse');
    accordionItems.forEach(item => new bootstrap.Collapse(item, { toggle: false }));
  });

  console.log("🎉 Bootstrap initialisé !");
} catch (err) {
  console.error("❌ Erreur pendant l'initialisation :", err);
}
