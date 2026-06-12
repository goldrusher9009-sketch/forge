FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 4000
CMD ["sh", "start.sh"]
