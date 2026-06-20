FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npx esbuild src/index.ts --bundle=false --platform=node --target=node18 --format=cjs --outfile=dist/index.js

EXPOSE 3000

CMD ["node", "--max-old-space-size=1024", "dist/index.js"]
