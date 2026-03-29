# RentaFacil TPymes — Railway production build
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# ---- Build (no cache) ----
FROM deps AS build
# Force cache invalidation on every deploy
ARG RAILWAY_GIT_COMMIT_SHA
ARG CACHEBUST=1
COPY . .
RUN pnpm run build && echo "Built at $(date) from ${RAILWAY_GIT_COMMIT_SHA:-unknown}" > dist/build-info.txt

# ---- Production (lean) ----
FROM base AS production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod
# dist/ contains server (index.js) and client statics (public/)
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/migrations ./migrations

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]
