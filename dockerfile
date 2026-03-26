# ── Build stage ──────────────────────────────────────────
FROM node:20 AS build

WORKDIR /app

# Vite requires VITE_ prefix for env vars to be exposed to client code.
ARG VITE_API_BASE_URL=/auth/api/v1
ARG VITE_CORE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CORE_API_BASE_URL=$VITE_CORE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Serve stage ──────────────────────────────────────────
FROM nginx:alpine

ARG NGINX_CONF=nginx.config

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Add our config
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

# Copy build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]