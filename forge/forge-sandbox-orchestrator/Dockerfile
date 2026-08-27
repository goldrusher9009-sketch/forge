FROM docker.m.daocloud.io/library/node:20-bookworm-slim

RUN sed -i \
      -e 's|http://deb.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' \
      -e 's|http://security.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' \
      -e 's|http://deb.debian.org/debian|http://mirrors.aliyun.com/debian|g' \
      /etc/apt/sources.list.d/debian.sources

WORKDIR /app
COPY package.json ./
COPY src ./src

RUN useradd --system --uid 10002 --create-home forge-orchestrator \
    && mkdir -p /var/lib/forge-sandbox \
    && chown -R forge-orchestrator:forge-orchestrator /app \
    && chown root:root /var/lib/forge-sandbox \
    && chmod 0700 /var/lib/forge-sandbox

# The orchestrator is the single internal Docker-control boundary. It needs
# access to the mounted Engine socket; only the per-Run runtime is non-root.
EXPOSE 3001
CMD ["node", "src/index.js"]
