# syntax=docker/dockerfile:1

# ---- deps: install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --ignore-scripts: the package.json `postinstall` runs `fumadocs-mdx`, which
# needs source.config.ts + content/ to exist — neither is copied into this
# stage. The builder stage below copies everything and runs it explicitly.
# --legacy-peer-deps: fumadocs-core declares an *optional* peer on zod@4.x,
# while ai/@openrouter/ai-sdk-provider declare a *hard* peer on zod@^3.x.
# npm's strict peer resolver (npm 7+) treats these as a hard conflict even
# though fumadocs-core's peer is optional and fumadocs-mdx resolves its own
# zod v4 copy independently deep in the tree. --legacy-peer-deps skips that
# strict cross-package peer check (pre-npm7 behavior) so both zod majors can
# coexist at their respective depths; the scoped `overrides` in package.json
# still pin zod v3 specifically under ai/@openrouter's own subtree.
RUN npm ci --ignore-scripts --legacy-peer-deps

# ---- builder: run fumadocs-mdx + next build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy only what's actually needed to build — no .git, no Dockerfile/compose,
# no local-only tooling files. Content and media are baked into the image
# (see note in docker-compose.yml about why nothing is volume-mounted).
COPY package.json ./
COPY next.config.mjs source.config.ts tsconfig.json postcss.config.js ./
COPY mdx-components.tsx ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY content ./content
COPY public ./public

# postinstall (fumadocs-mdx) already ran during `npm install` in deps, but
# content is copied after that step, so regenerate the .source cache now.
RUN npx fumadocs-mdx

# Sanity check: confirm the resolved versions actually landed on the
# Fumadocs v16 / Next.js 16 / React 19.2 line (see package.json comment
# history / raidguides-test-image for why — fumadocs-mdx 11.x/14.x/15.0.13
# were all version-skewed against fumadocs-core within the 15.x line, with
# no working pairing found there). Remove this block once confirmed stable.
RUN echo "===== resolved fumadocs versions =====" ; \
    grep '"version"' node_modules/fumadocs-core/package.json | head -1 | sed 's/^/fumadocs-core: /' ; \
    grep '"version"' node_modules/fumadocs-ui/package.json | head -1 | sed 's/^/fumadocs-ui: /' ; \
    grep '"version"' node_modules/fumadocs-mdx/package.json | head -1 | sed 's/^/fumadocs-mdx: /' ; \
    grep '"version"' node_modules/next/package.json | head -1 | sed 's/^/next: /' ; \
    grep '"version"' node_modules/react/package.json | head -1 | sed 's/^/react: /' ; \
    echo "===== END DEBUG ====="

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal standalone production image ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone output contains a minimal server + pruned node_modules.
# Note: .next/standalone already contains its own copy of public/ and
# .next/static assembled by Next during build, but Next does NOT copy them
# there automatically — we do it explicitly below, as documented by Next.js.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Runtime configuration (NODE_ENV, PORT, HOSTNAME, NEXT_TELEMETRY_DISABLED)
# is set in docker-compose.yml rather than baked in here, so it can be
# adjusted per-deployment without rebuilding the image.
EXPOSE 3000

CMD ["node", "server.js"]
