FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npx esbuild src/index.ts --bundle=true --platform=node --target=node18 --format=cjs --external:better-sqlite3 --external:bcryptjs --external:jsonwebtoken --external:socket.io --external:express --outfile=dist/index.js || \
    (echo "esbuild failed, falling back to ts-node" && mkdir -p dist && echo "require('ts-node/register'); require('./src/index.ts');" > dist/index.js)

EXPOSE 3000

CMD ["node", "--max-old-space-size=2048", "dist/index.js"]
