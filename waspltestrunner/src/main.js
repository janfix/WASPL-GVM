import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createI18n } from 'vue-i18n';
import router from './router/index.js';
import './style.css';

// Import Bootstrap CSS and JS
// HERE IS THE MAIN OF TESTRUNNER !
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

import fr from './locales/fr.json';
import en from './locales/en.json';

const messages = { fr, en };

window.bootstrap = bootstrap;


const i18n = createI18n({
  legacy: false, // composition API
  locale: 'fr', // langue par défaut
  fallbackLocale: 'en',
  messages,
});

try {
  console.log("🔧 Initialisation de l'app Vue...");

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(i18n);
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
