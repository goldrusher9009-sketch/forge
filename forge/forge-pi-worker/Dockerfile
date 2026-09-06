ARG NODE_IMAGE=docker.m.daocloud.io/library/node:24-bookworm-slim
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY src ./src
COPY ecosystem.mjs ./ecosystem.mjs
COPY ecosystem.json ./ecosystem.json
COPY skills ./skills
USER node
EXPOSE 8791
CMD ["node", "--import", "tsx", "src/server.mjs"]
