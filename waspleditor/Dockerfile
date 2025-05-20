FROM node:20-alpine AS builder
WORKDIR /app
COPY .env.docker .env
COPY package*.json ./
COPY index.html ./
COPY interactions.js ./
COPY vite.config.* ./
COPY ./src ./src
COPY ./public ./public

RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache netcat-openbsd
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY ./server ./server
COPY scripts/wait-for-mongo.sh ./wait-for-mongo.sh
RUN chmod +x ./wait-for-mongo.sh
ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["sh", "wait-for-mongo.sh"]
CMD ["node", "server/index.js"]
