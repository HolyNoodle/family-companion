FROM node:18 as builder

RUN npm i -g pnpm

WORKDIR /src

COPY . /src

RUN pnpm install turbo -w
RUN pnpm install
RUN pnpm dlx turbo build

FROM node:alpine as runner 

#Add bash and nginx and create the run folder for nginx.
RUN apk update && apk add bash nginx && mkdir -p /run/nginx

COPY ./ingress-ha.conf /etc/nginx/nginx.conf

WORKDIR /app

RUN mkdir -p /app/apps/client/dist
RUN mkdir -p /app/apps/server/dist

COPY --from=builder /src/apps/client/dist /app/apps/client/dist
COPY --from=builder /src/apps/server/dist /app/apps/server/dist

EXPOSE 8099

ENV STORAGE_PATH /data/db
ENV SUPERVISOR_URL supervisor/core

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;error_log /dev/stdout info;\" & npm run start:prod" ]