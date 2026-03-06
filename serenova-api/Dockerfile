# Build API
FROM node:18-alpine

# Installation des dépendances système nécessaires pour Prisma sur Alpine
RUN apk add --no-cache openssl openssl1.1-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
