# Build stage
FROM node:20 AS build

WORKDIR /app

ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

ARG CORE_API_BASE_URL
ENV CORE_API_BASE_URL=$CORE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Add our config
COPY nginx.config /etc/nginx/conf.d/default.conf

# Copy build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]