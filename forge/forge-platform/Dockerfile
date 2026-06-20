FROM node:20-bullseye-slim

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (including better-sqlite3 which compiles native)
RUN npm install

# Copy source
COPY . .

# Build with esbuild
RUN npx esbuild src/index.ts --bundle=false --platform=node --target=node18 --outfile=dist/index.js

EXPOSE 3000

CMD ["node", "dist/index.js"]
