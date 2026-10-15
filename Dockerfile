# Stage 1: build
FROM node:24 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=optional

COPY . .
RUN npm run build

# Stage 2: chạy thật
FROM node:24
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=optional

COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/main.js"]