FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci --include=dev

COPY . .

RUN npx prisma generate
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
