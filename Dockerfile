FROM node:18

RUN npm i -g pnpm

#Add nginx and create the run folder for nginx.
RUN apt update
RUN apt install nginx -y && mkdir -p /run/nginx

COPY ./ingress.conf /etc/nginx/sites-enabled/ingress.conf

WORKDIR /app

COPY . .

RUN pnpm i

EXPOSE 8099

ENV STORAGE_PATH /data/db
ENV SUPERVISOR_URL supervisor/core

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;error_log /dev/stdout info;\" & pnpm start" ]