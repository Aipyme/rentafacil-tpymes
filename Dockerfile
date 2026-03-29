# RentaFacil TPymes — Railway production build (NO CACHE)
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Single stage - no cache optimization, just correctness
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN cat dist/build-info.txt 2>/dev/null || echo "no build-info"
RUN echo "ROUTES CHECK:" && grep -c "notificacionesRouter\|borradorRouter" dist/index.js || echo "NOT FOUND"

# Remove devDeps after build
RUN pnpm prune --prod

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]
