# 1) React ki build
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# 2) Server + tayyar build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix server
COPY server/ ./server/
COPY --from=client /app/client/dist ./client/dist
USER node
EXPOSE 5000
CMD ["node", "server/src/server.js"]
