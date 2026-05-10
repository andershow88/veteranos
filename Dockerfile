FROM node:22-bookworm-slim AS base

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- deps stage: install once, cache aggressively ---------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev --prefer-offline --no-audit --no-fund

# ---- build stage ------------------------------------------------------------
FROM deps AS builder
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ---- runtime stage: lean image ----------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

# Boot sequence:
#   1. db push    -> sync schema (creates tables on a fresh DB; no migration tracking)
#   2. db:seed    -> idempotent admin upsert; '|| true' so a seed glitch never blocks boot
#   3. next start -> serve traffic
CMD ["sh", "-c", "npx tsx prisma/prepare-db.ts && npx prisma db push --accept-data-loss --skip-generate && (npm run db:seed || echo 'seed skipped') && npm run start"]
