# Stage 1: Build React App
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# If using yarn: COPY yarn.lock ./
RUN npm ci
COPY . ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Remove default Nginx configuration (good practice before copying your own)
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration file (created in Step 1)
# This will replace the default configuration Nginx uses.
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the 'builder' stage to Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Ensure Nginx starts when the container launches
CMD ["nginx", "-g", "daemon off;"]
