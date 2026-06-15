FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++   # for better-sqlite3 native build
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 4000
CMD ["node", "src/index.js"]
