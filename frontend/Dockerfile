FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Create non-root user
RUN addgroup -g 1000 -S recyclic && \
    adduser -S recyclic -u 1000

# Change ownership
RUN chown -R recyclic:recyclic /app
USER recyclic

EXPOSE 3000

CMD ["npm", "start"]
