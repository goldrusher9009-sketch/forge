FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Use pre-compiled dist/index.js (esbuild skipped — dist committed to repo)

EXPOSE 3000

CMD ["node", "--max-old-space-size=4096", "-r", "ts-node/register/transpile-only", "src/index.ts"]
