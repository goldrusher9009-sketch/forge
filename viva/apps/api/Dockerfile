FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY .env* ./

EXPOSE 4000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
