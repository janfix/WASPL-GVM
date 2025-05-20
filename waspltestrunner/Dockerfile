# Étape build frontend
FROM node:18 AS builder
WORKDIR /app

# Ne pas fixer NODE_ENV ici pour que les devDependencies soient installées
COPY .env.production.docker .env.production       
COPY package.json package-lock.json ./

# ✅ Installer avec les devDependencies pour que Vite soit présent
RUN npm ci --include=dev

COPY . .

# ✅ Construction du frontend
RUN npx vite build --mode production.docker              

# Étape backend
FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y netcat-openbsd && apt-get clean

# ✅ Définition de l'environnement de production uniquement ici
ENV NODE_ENV=production

COPY .env.production.docker .env.production
COPY package.json package-lock.json ./

# ✅ Installation allégée sans devDependencies
RUN npm ci --omit=dev

COPY server ./server
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY wait-for-mongo.sh ./scripts/wait-for-mongo.sh
COPY --from=builder /app/dist ./dist

RUN chmod +x ./scripts/wait-for-mongo.sh

EXPOSE 3011
CMD ["sh", "./scripts/wait-for-mongo.sh", "node", "server/index.js"]
