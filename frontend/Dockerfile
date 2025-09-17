FROM node:18-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files
COPY package*.json ./

# Change ownership and switch to non-root user
RUN chown -R node:node /app
USER node

# Install dependencies as non-root user
RUN npm ci

# Copy source code
COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY vite.config.js ./

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
