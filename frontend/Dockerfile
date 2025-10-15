# Étape 1: Builder l'application React
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances et les installer
COPY package*.json ./
RUN npm install

# Copier le reste du code source
COPY . .

# Sélection d'environnement de build (dev|staging|production)
ARG APP_ENV=production
ENV APP_ENV=$APP_ENV

# Copier le bon fichier d'environnement avant le build
RUN cp .env.$APP_ENV .env || (echo "Fichier .env.$APP_ENV introuvable" && exit 1)

# Construire l'application pour la production
RUN echo "----> Building with APP_ENV: $APP_ENV" && npm run build

# Étape 2: Servir l'application avec Nginx
FROM nginx:stable-alpine

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# AJOUTE CETTE LIGNE - C'est la commande "Terre Brûlée"
# Elle efface tout le contenu par défaut de NGINX avant la copie.
RUN rm -rf /usr/share/nginx/html/*

# Copier les fichiers de build de l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]