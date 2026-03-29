# RentaFacil TPymes — Railway production build
FROM node:22-slim
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Verify build contains new routers
RUN echo "=== BUILD VERIFICATION ===" && \
    grep -c "notificacionesRouter\|borradorRouter" dist/index.js && \
    echo "BUILD_HASH=$(md5sum dist/index.js | cut -c1-12)" && \
    md5sum dist/index.js > dist/BUNDLE_HASH

# Remove devDeps
RUN pnpm prune --prod

ENV NODE_ENV=production
EXPOSE 8080

# Start with hash verification
CMD echo "BUNDLE: $(cat dist/BUNDLE_HASH)" && node dist/index.js
