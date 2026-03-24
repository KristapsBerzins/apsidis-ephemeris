FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---

FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Download Swiss Ephemeris data files (1800–2400 AD coverage, ~2 MB)
RUN mkdir -p ephemeris && \
    curl -fL "https://github.com/aloistr/swisseph/raw/master/ephe/sepl_18.se1" -o ephemeris/sepl_18.se1 && \
    curl -fL "https://github.com/aloistr/swisseph/raw/master/ephe/semo_18.se1" -o ephemeris/semo_18.se1 && \
    curl -fL "https://github.com/aloistr/swisseph/raw/master/ephe/seas_18.se1" -o ephemeris/seas_18.se1

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
