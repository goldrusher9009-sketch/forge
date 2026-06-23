FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npx esbuild src/index.ts src/autonomy.ts --bundle=false --platform=node --target=node18 --format=cjs --outdir=dist

EXPOSE 3000

CMD ["node", "--max-old-space-size=2048", "dist/index.js"]
