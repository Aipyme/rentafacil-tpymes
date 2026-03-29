# RentaFacil TPymes — Railway production build
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY . .
RUN pnpm run build

# ---- Production ----
# Install ALL deps because esbuild --packages=external leaves
# vite/tailwind/etc. as runtime imports in the server bundle.
FROM base AS production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile
# dist/ contains server (index.js) and client statics (public/)
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/migrations ./migrations

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
