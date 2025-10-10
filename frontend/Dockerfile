# Étape finale : Servir des fichiers statiques avec Nginx
FROM nginx:stable-alpine

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Commande "Terre Brûlée" pour s'assurer que le répertoire est vide
RUN rm -rf /usr/share/nginx/html/*

# Copier le contenu de notre "Colis Doré"
COPY frontend-dist.tar.gz /tmp/
RUN tar -xzvf /tmp/frontend-dist.tar.gz -C /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]