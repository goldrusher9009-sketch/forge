FROM docker.m.daocloud.io/library/node:20-bookworm-slim

# Bootstrap HTTPS with Node's bundled Mozilla roots; Debian ca-certificates replaces this bundle.
RUN node -e "const fs = require('fs'); fs.mkdirSync('/etc/ssl/certs', {recursive:true}); fs.writeFileSync('/etc/ssl/certs/ca-certificates.crt', require('tls').rootCertificates.join('\n') + '\n')" \
    && sed -i \
      -e 's|http://deb.debian.org/debian-security|https://mirrors.ustc.edu.cn/debian-security|g' \
      -e 's|http://security.debian.org/debian-security|https://mirrors.ustc.edu.cn/debian-security|g' \
      -e 's|http://deb.debian.org/debian|https://mirrors.ustc.edu.cn/debian|g' \
      /etc/apt/sources.list.d/debian.sources \
    && apt-get -o Acquire::By-Hash=false -o Acquire::Retries=2 -o Acquire::https::Timeout=30 update \
    && apt-get -o Acquire::Retries=2 -o Acquire::https::Timeout=30 install -y --no-install-recommends \
      ca-certificates \
      chromium \
      fonts-noto-cjk \
      fonts-noto-color-emoji \
      tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/forge-sandbox
COPY package*.json ./
RUN npm ci --omit=dev --registry=https://registry.npmmirror.com --no-audit --no-fund \
    && npm cache clean --force
COPY idle.js tool.js ./

RUN groupadd --gid 10001 sandbox \
    && useradd --uid 10001 --gid 10001 --create-home --home-dir /home/sandbox --shell /usr/sbin/nologin sandbox \
    && mkdir -p /workspace /artifacts \
    && chown -R 10001:10001 /workspace /artifacts /home/sandbox \
    && chmod 0555 /opt/forge-sandbox/idle.js /opt/forge-sandbox/tool.js

ENV CHROMIUM_PATH=/usr/bin/chromium \
    HOME=/home/sandbox \
    NODE_ENV=production
USER 10001:10001
WORKDIR /workspace
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "/opt/forge-sandbox/idle.js"]
