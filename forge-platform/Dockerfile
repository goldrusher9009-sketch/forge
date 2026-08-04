FROM node:20.18.0-bullseye-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "--max-old-space-size=4096", "dist/index.js"]
