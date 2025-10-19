# Étape 1: Builder l'application React
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances et les installer
COPY package*.json ./
RUN npm install

# Copier le reste du code source
COPY . .

# Installer git pour pouvoir exécuter les commandes git
RUN apk add --no-cache git

# Définir les arguments de build pour les variables d'environnement
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Générer les informations de build directement
RUN VERSION=$(node -p "require('./package.json').version") && \
    COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") && \
    COMMIT_DATE=$(git log -1 --format=%ci 2>/dev/null || echo "unknown") && \
    BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") && \
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown") && \
    mkdir -p public && \
    cat > public/build-info.json << EOF
{
  "version": "$VERSION",
  "commitSha": "$COMMIT_SHA",
  "commitDate": "$COMMIT_DATE",
  "buildDate": "$BUILD_DATE",
  "branch": "$BRANCH"
}
EOF

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