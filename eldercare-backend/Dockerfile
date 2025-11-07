# syntax=docker/dockerfile:1.7

# Build
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# If you transpile (TS/etc): RUN npm run build

# Runtime (distroless)
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
USER 10001:10001
COPY --from=build /app /app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD ["node","-e","fetch('http://127.0.0.1:8080/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["server.js"]
