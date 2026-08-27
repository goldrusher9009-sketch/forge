FROM docker.m.daocloud.io/library/node:20-bookworm-slim

RUN sed -i \
      -e 's|http://deb.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' \
      -e 's|http://security.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' \
      -e 's|http://deb.debian.org/debian|http://mirrors.aliyun.com/debian|g' \
      /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
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
