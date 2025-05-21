# Stage 1: Build React App
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# If using yarn: COPY yarn.lock ./
RUN npm ci
COPY . ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Nginx will be configured on the VPS directly or via Docker Compose with a custom config
# This Dockerfile just prepares the static content
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
# The CMD will be handled by the Docker Compose Nginx service using a custom config
# CMD ["nginx", "-g", "daemon off;"]
