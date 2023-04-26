FROM node:alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN apk update

RUN yarn global add turbo
RUN npm i -g pnpm

COPY . .

RUN pnpm install
 
# Build the project
RUN turbo run build

FROM node:alpine as runner 
WORKDIR /app

RUN npm i -g pnpm
RUN apk update
RUN apk add bash nginx 
RUN mkdir -p /run/nginx

COPY ./ingress-ha.conf /etc/nginx/nginx.conf

COPY --from=builder /app .

RUN pnpm install --production

EXPOSE 8099

ENV STORAGE_PATH /data/db
ENV SUPERVISOR_URL supervisor/core

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]