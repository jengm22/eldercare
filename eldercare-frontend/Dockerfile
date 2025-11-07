# syntax=docker/dockerfile:1.7

# Build static assets
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# For CRA/Vite:
RUN npm run build

# Serve with Nginx
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .   # CRA uses 'build', Vite uses 'dist'
# If CRA: change previous line to: COPY --from=build /app/build .
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
