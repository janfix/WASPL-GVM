VOIR TODO APP 
Penser à avoir MongoDB server en fonction au niveau des services 
Lancement du serveur : npm run start-server   
Lancement de l'application : npm run dev

Comment lancer l'IA Locale : 
1. Mettre à jour OLLAMA
2. Lancer Docker
3. Lancer L'API : Ollama Docker Fastapi : aller dans le rep. fastapi





Todo : 
1. Mettre en place la database : mongodb optimisée
2. Compléter le cycle : Charger un json, le modifier le sauvegarder et le récupérer
5. Concevoir l'interaction choice/block
  
8. Une modalité de test : Tant que tu n'as pas la bonne réponse tu ne peux pas avancer, mais tu as droit à 1, 2 ou 3 joker : ou bien une pénalité de temps... un joker au bout de X minutes !
9.  Créer une modalité trivial pursuite
10. Créer l'interaction GeoGebra
11. Intégrer l'éditeur Mathématique

Les rôles et les accès : 
Attention il n'y aura pas à proprement parler de rôles : mais un routage vers l'éditeur ou vers le Test runner !


# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).



1. Attention, il suffit d'importer le store dans n'importe quel élément et d'utiliser setTestData(TEST) et hop le test est à jour sans besoin dautre chose 
2. Comment ajouter une nouvelle interaction ?
    a. Créer un répertoir portant le nom de la nouvelle interaction
    b. Créer dans ce répertoire au minimum, les fichiers Editor.vue, Preview.vue, model.json. Ajouter au besoin d'autres fichiers. 
    c. A la racine du projet Ajouter dans le fichier interactions.js, la nouvelle interaction et ses paths.
    



