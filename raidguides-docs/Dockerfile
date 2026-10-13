# syntax=docker/dockerfile:1

# ---- deps: install dependencies ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --ignore-scripts: the package.json `postinstall` runs `fumadocs-mdx`, which
# needs source.config.ts + content/ to exist — neither is copied into this
# stage. The builder stage below copies everything and runs it explicitly.
RUN npm ci --ignore-scripts --no-audit --no-fund

# ---- builder: run fumadocs-mdx + next build ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Content and media are baked into the image alongside the application.
COPY package.json ./
COPY next.config.mjs source.config.ts tsconfig.json postcss.config.js ./
COPY mdx-components.tsx ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY content ./content
COPY public ./public
COPY tests ./tests

# Generate MDX now that the config and content are present.
RUN npx fumadocs-mdx

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm test
RUN npm run build

# ---- runner: minimal standalone production image ----
FROM node:24-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone output contains the minimal server and pruned node_modules.
# Public assets and the static bundle need to be copied separately.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["node", "server.js"]
