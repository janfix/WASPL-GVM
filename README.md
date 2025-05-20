# WASPL - Digital Assessment Platform (Pre-Alpha)

![Version](https://img.shields.io/badge/status-pre--alpha-red)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)
![Tech](https://img.shields.io/badge/stack-Node.js%2C%20Vue3%2C%20MongoDB%2C%20Docker-blue)

## 🧭 Table of Contents
- [WASPL - Digital Assessment Platform (Pre-Alpha)](#waspl---digital-assessment-platform-pre-alpha)
  - [🧭 Table of Contents](#-table-of-contents)
  - [📘 Overview](#-overview)
  - [✨ Features](#-features)
  - [🧱 Architecture](#-architecture)
  - [🚀 Getting Started](#-getting-started)
    - [🔧 Local Development (No Docker)](#-local-development-no-docker)
    - [🐳 Docker Usage](#-docker-usage)
      - [🧪 Mode Développement (hot-reload)](#-mode-développement-hot-reload)
      - [🚀 Mode Production (with NGINX)](#-mode-production-with-nginx)
      - [⚙️ Commandes `make` disponibles](#️-commandes-make-disponibles)
  - [⚙️ Environment Variables](#️-environment-variables)
  - [Default user :](#default-user-)
  - [📂 Folder Structure](#-folder-structure)
  - [🤝 Contributing](#-contributing)
  - [📝 License](#-license)

## 📘 Overview
WASPL is an open-source **digital assessment platform** designed to create, manage, and deliver interactive online tests. Built using modern technologies like **Node.js, Vue 3, MongoDB, and Docker**, WASPL provides educators with the tools to create flexible and rich test experiences.

> ⚠️ **Pre-Alpha Version**: This software is in early development and not yet production-ready.

## ✨ Features
- **Waspleditor**: Build structured assessments with interactive question types (choice, ordering, gap-fill, etc.).
- **WasplTestRunner**: Deliver and run tests in EXAM or LEARNING mode with response tracking.
- **MongoDB Integration**: Store user responses and test metadata.
- **ESM modules**: All components use strict ESM imports.

## 🧱 Architecture
WASPL is composed of three main applications:
- `waspleditor`: the admin/editor interface for building tests.
- `waspltestrunner`: the user interface for taking tests.
- `wasplwiki`: documentation and collaborative wiki service (VuePress-based).

These apps communicate with a shared backend and a MongoDB database. Docker containers orchestrate the services in networked environments.

## 🚀 Getting Started

### 🔧 Local Development (No Docker)
```bash
git clone https://github.com/your-org/WASPL.git
cd WASPL
# Installer les dépendances de chaque app
cd waspleditor && npm install && cd ../waspltestrunner && npm install
# Lancer MongoDB manuellement si besoin (port 27017)
# Puis exécuter chaque app en mode dev :
cd ../waspleditor && npm run dev
cd ../waspltestrunner && npm run dev
```

### 🐳 Docker Usage

#### 🧪 Mode Développement (hot-reload)
- Utilise `docker-compose.yml + docker-compose.override.yml`
- Utilise `Dockerfile.dev` dans waspleditor

```bash
make dev
```
- Waspleditor: http://localhost:5173
- WasplTestRunner: http://localhost:5174

> ✅ Les services attendent automatiquement MongoDB avant de démarrer (`wait-for-mongo.sh`)

#### 🚀 Mode Production (with NGINX)
- Utilise `docker-compose.yml + docker-compose.prod.yml`
- Utilise `Dockerfile` (build final frontend + backend)

```bash
make prod
```
- Accès unique via : http://localhost/
  - `/editor/` pour l'éditeur
  - `/runner/` pour la passation

> 🛡️ Le proxy NGINX gère la redirection, les headers de sécurité et la compression gzip

#### ⚙️ Commandes `make` disponibles

| Commande              | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| `make dev`            | Lance tous les services en mode développement (hot-reload).                |
| `make prod`           | Lance tous les services en mode production (avec NGINX).                   |
| `make down`           | Arrête et supprime tous les containers.                                    |
| `make reset-db`       | Supprime les données MongoDB locales (dossier `./mongodb`) + prune volumes.|
| `make reset-all`      | Supprime les containers, les données MongoDB et les images WASPL locales. |
| `make wiki`           | Lance uniquement le wiki de documentation.                                 |
| `make dev-with-wiki`  | Lance l’environnement complet de développement avec wiki intégré.         |

## ⚙️ Environment Variables

Créez un fichier `.env` à la racine contenant :
```env
MONGO_URI=mongodb://mongodb:27017/waspldata
NODE_ENV=development
```
Chaque app peut avoir ses propres ports ou variables supplémentaires.

## Default user : 
Credential for connection : 
login : admin
Mot de passe : password


## 📂 Folder Structure
```
├── waspleditor/               # Vue3 + Vite app for test creation (frontend/backend)
│   ├── Dockerfile             # Production build (frontend+backend)
│   └── Dockerfile.dev         # Dev mode (hot-reload)
├── waspltestrunner/           # Vue3 + Vite app for test execution
├── shared/                    # Common utility and domain models
├── media/                     # Static resources (audio/images)
├── scripts/                   # Tooling (wait-for-mongo.sh, certbot-init.sh, mongo-init)
├── certbot/                   # Certbot challenge + config
├── docker-compose.yml         # Base Docker config
├── docker-compose.override.yml # Dev overrides
├── docker-compose.prod.yml     # Production config with NGINX
├── nginx.conf / nginx.conf.wiquid # NGINX configurations (HTTP/HTTPS)
├── Makefile                   # CLI simplifiée
```

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request. Follow the code style used in the project and write meaningful commit messages.

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


