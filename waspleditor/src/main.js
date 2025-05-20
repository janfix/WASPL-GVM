import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { BNavbar, BNavbarBrand, BNavbarNav} from 'bootstrap-vue-next';

import 'tabulator-tables/dist/css/tabulator_bootstrap5.min.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import router from './router'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser, faEdit, faTrash, faPlus, faPlusCircle,faCircleInfo } from '@fortawesome/free-solid-svg-icons'; // Import des icônes spécifiques
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import '@fortawesome/fontawesome-free/css/all.css';
import './style.css'


// Import des icônes spécifiques
import { faGear, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import App from './App.vue'

// Ajouter les icônes à la bibliothèque
library.add(faGear, faCircleUser,faCircleInfo);
// Ajouter les icônes à la bibliothèque
library.add(faUser, faEdit, faTrash, faPlus, faPlusCircle);

const app = createApp(App)
const pinia = createPinia()

// Enregistrer les composants globalement
app.component('BNavbar', BNavbar);
app.component('BNavbarBrand', BNavbarBrand);
app.component('BNavbarNav', BNavbarNav); // Ajoutez ce composant aussi si vous l'utilisez
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router)
app.use(pinia)
app.mount('#app')