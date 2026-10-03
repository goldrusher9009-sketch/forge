ARG NODE_IMAGE=docker.m.daocloud.io/library/node:20-bookworm-slim
FROM ${NODE_IMAGE}

RUN node -e "const fs = require('fs'); fs.mkdirSync('/etc/ssl/certs', {recursive:true}); fs.writeFileSync('/etc/ssl/certs/ca-certificates.crt', require('tls').rootCertificates.join('\n') + '\n')" \
    && sed -i \
      -e 's|http://deb.debian.org/debian-security|https://mirrors.ustc.edu.cn/debian-security|g' \
      -e 's|http://security.debian.org/debian-security|https://mirrors.ustc.edu.cn/debian-security|g' \
      -e 's|http://deb.debian.org/debian|https://mirrors.ustc.edu.cn/debian|g' \
      /etc/apt/sources.list.d/debian.sources \
    && apt-get -o Acquire::By-Hash=false -o Acquire::Retries=2 -o Acquire::https::Timeout=30 update \
    && apt-get -o Acquire::Retries=2 -o Acquire::https::Timeout=30 install -y --no-install-recommends ca-certificates python3 make g++ util-linux poppler-utils tesseract-ocr tesseract-ocr-eng tesseract-ocr-chi-sim tesseract-ocr-chi-tra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm pkg delete devDependencies \
    && npm ci --omit=dev --registry=https://registry.npmmirror.com --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src

RUN NODE_OPTIONS="--max-old-space-size=4096" \
    npm exec --yes --package=esbuild@0.19.12 --registry=https://registry.npmmirror.com -- \
    npm run build \
    && npm cache clean --force

EXPOSE 3000

CMD ["node", "--max-old-space-size=4096", "dist/index.js"]
