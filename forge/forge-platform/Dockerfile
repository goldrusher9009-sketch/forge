FROM docker.m.daocloud.io/library/node:20-bullseye-slim

RUN sed -i \
      -e 's|http://deb.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' \
      -e 's|http://security.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' \
      -e 's|http://deb.debian.org/debian|http://mirrors.aliyun.com/debian|g' \
      /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm pkg delete devDependencies \
    && npm ci --omit=dev --registry=https://registry.npmmirror.com --no-audit --no-fund
COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" \
    npm exec --yes --package=esbuild@0.19.12 --registry=https://registry.npmmirror.com -- \
    esbuild src/index.ts src/sandbox-contract.ts src/pi-runtime.ts --bundle=false --platform=node --target=node18 --format=cjs --outdir=dist \
    && npm cache clean --force

EXPOSE 3000

CMD ["node", "--max-old-space-size=4096", "dist/index.js"]
