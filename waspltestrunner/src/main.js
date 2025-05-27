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
import it from './locales/it.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import es from './locales/es.json';


const messages = { fr, en, it, de, pt, es };
const supportedLangs = ['fr', 'en', 'it', 'pt','es', 'de']

window.bootstrap = bootstrap;

// Détection langue navigateur
const browserLang = navigator.language?.split('-')[0]
const defaultLang = supportedLangs.includes(browserLang) ? browserLang : 'fr'
console.log(defaultLang)

const i18n = createI18n({
  legacy: false, // composition API
  locale: defaultLang, // langue par défaut
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
