FROM node:alpine as builder

RUN npm i -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install turbo -w
RUN pnpm install
RUN pnpm dlx turbo build

FROM node:alpine as runner 

RUN npm i -g pnpm

#Add bash and nginx and create the run folder for nginx.
RUN apk update && apk add bash nginx && mkdir -p /run/nginx

COPY ./ingress-ha.conf /etc/nginx/nginx.conf

WORKDIR /app

COPY . .

RUN mkdir -p /app/apps/client/dist
RUN mkdir -p /app/apps/server/dist

RUN pnpm install --production

COPY --from=builder /app/apps/client/dist /app/apps/client/dist
COPY --from=builder /app/apps/server/dist /app/apps/server/dist

EXPOSE 8099

ENV STORAGE_PATH /data/db
ENV SUPERVISOR_URL supervisor/core

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]