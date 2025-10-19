# Étape 1: Builder l'application React
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances et les installer
COPY package*.json ./
RUN npm install

# Copier le reste du code source (inclut le script generate-build-info.sh)
COPY . .

# Installer git pour pouvoir exécuter les commandes git
RUN apk add --no-cache git

# Définir les arguments de build pour les variables d'environnement
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Args passés par l'hôte/CI pour générer build-info.json
ARG COMMIT_SHA=unknown
ARG BRANCH=unknown
ARG COMMIT_DATE=unknown
ARG BUILD_DATE=unknown

# Générer build-info.json à partir des ARG (sans dépendre de git dans l'image)
RUN mkdir -p public \
  && node -e "const fs=require('fs');const pkg=require('./package.json');const data={version:pkg.version,commitSha:process.env.COMMIT_SHA||'unknown',commitDate:process.env.COMMIT_DATE||'unknown',buildDate:process.env.BUILD_DATE||'unknown',branch:process.env.BRANCH||'unknown'};fs.writeFileSync('public/build-info.json',JSON.stringify(data,null,2)+'\\n')"

# Construire l'application pour la production
RUN echo "----> Building with API URL: $VITE_API_URL and Commit SHA: $VITE_APP_COMMIT_SHA" && npm run build

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