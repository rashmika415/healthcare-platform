FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_API_BASE_URL=http://localhost:3000
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

ARG REACT_APP_NOTIFICATION_URL=
ENV REACT_APP_NOTIFICATION_URL=${REACT_APP_NOTIFICATION_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
