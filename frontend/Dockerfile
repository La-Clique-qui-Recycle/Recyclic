# Étape 1: Builder l'application React
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances et les installer
COPY package*.json ./
RUN npm install

# Copier le reste du code source
COPY . .

# Définir les arguments de build pour les variables d'environnement
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construire l'application pour la production
RUN echo "----> Building with API URL: $VITE_API_URL" && npm run build

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
