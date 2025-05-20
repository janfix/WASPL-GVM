import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import Login from '../views/Login.vue';
import PublicationList from '../views/PublicationList.vue';
import TestRunner from '../components/TestRunner.vue';
import TestPreviewer from '../components/TestPreviewer.vue';
import { useAuthStore } from "@/stores/auth";
import SnapshotTest from '../views/SnapshotTest.vue';
import SnapshotTestKonva from '../views/SnapshotTestKonva.vue';


const routes = [
  {
  path: '/test',
  name: 'TestPage',
  component: { template: '<div>🧪 Test Page Vue Router</div>' }
},
  {
    path: '/',
    redirect: '/publications'
  },
  {
    path: '/publications',
    name: 'Publication',
    component: PublicationList,
    meta: { requiresAuth: true },
  },
 /*  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  }, */
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/test-runner',
    name: 'TestRunner',
    component: TestRunner,
    meta: { requiresAuth: true },
  },
  {
    path: '/test-preview',
    name: 'testpreview',
    component: TestPreviewer,
  },
  {
    path: '/snapshot-test',
    name: 'SnapshotTest',
    component: SnapshotTest
  },
  {
    path: '/snapshot-testKonva',
    name: 'SnapshotTestKonva',
    component: SnapshotTestKonva
  },
  
];

const base = import.meta.env.BASE_URL || '/testrunner/'; 
const router = createRouter({
  history: createWebHistory(base),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 🔒 Vérifie si la route nécessite une auth
  if (to.meta.requiresAuth) {
    const isTokenValid = authStore.checkToken(); // ⏳ vérifie aussi expiration

    if (!isTokenValid) {
      return next({ path: '/login', query: { reason: 'expired' } });
    }
  }

  next();
});

router.afterEach((to) => {
  // Supprime toutes les classes du body qui pourraient venir d'autres pages
  document.body.className = '';

  // Ajoute une classe spécifique pour la page de login
  if (to.name === 'Login') {
    document.body.classList.add('login-page');
  }

  if (to.name === 'Home') {
    document.body.classList.add('home-page');
  }
});

export default router;
