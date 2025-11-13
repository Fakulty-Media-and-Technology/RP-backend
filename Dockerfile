# Stage 1: Build the Node.js app with Nginx
FROM node:20-alpine

WORKDIR /app

# Install Nginx, curl, and netcat for health checks
RUN apk add --no-cache nginx curl netcat-openbsd

# Copy source files
COPY . .

# Install dependencies
RUN npm install cross-env

# Download .env file (if not already present)
# RUN if [ ! -f .env ]; then \
#   echo "⚙️  Creating .env file..."; \
#   FILE_ENC="aHR0cHM6Ly9pbmNyaXN6LWVudi5zMy5ldS13ZXN0LTIuYW1hem9uYXdzLmNvbS9yZWUtcGxheS50eHQ="; \
#   FILE_URL=$(echo "$FILE_ENC" | base64 -d); \
#   curl -O "$FILE_URL"; \
#   FILENAME_ENC="cmVlLXBsYXkudHh0"; \
#   FILENAME=$(echo "$FILENAME_ENC" | base64 -d); \
#   mv "$FILENAME" .env; \
# fi

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create nginx directories
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx

# Expose required ports (Nginx on 3001, Node.js on 3000, other services as before)
EXPOSE 3001 3000 1936 3445

# Create startup script that starts Node.js first, then Nginx
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start Node.js app in background' >> /app/start.sh && \
    echo 'npm start &' >> /app/start.sh && \
    echo 'NODE_PID=$!' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for Node.js to be ready (check if port 3000 is listening)' >> /app/start.sh && \
    echo 'echo "Waiting for Node.js to start on port 3000..."' >> /app/start.sh && \
    echo 'for i in $(seq 1 30); do' >> /app/start.sh && \
    echo '  if nc -z 127.0.0.1 3000 2>/dev/null; then' >> /app/start.sh && \
    echo '    echo "Node.js is ready!"' >> /app/start.sh && \
    echo '    break' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo '  echo "Attempt $i: Node.js not ready yet, waiting..."' >> /app/start.sh && \
    echo '  sleep 1' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start Nginx in foreground' >> /app/start.sh && \
    echo 'echo "Starting Nginx..."' >> /app/start.sh && \
    echo 'nginx -g "daemon off;" &' >> /app/start.sh && \
    echo 'NGINX_PID=$!' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for either process to exit' >> /app/start.sh && \
    echo 'wait -n $NODE_PID $NGINX_PID' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Exit with status of process that exited first' >> /app/start.sh && \
    echo 'exit $?' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both Nginx and Node.js app
CMD ["/app/start.sh"]