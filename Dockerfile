FROM node:18

RUN npm i -g pnpm

#Add nginx and create the run folder for nginx.
RUN apt update
RUN apt install nginx -y && mkdir -p /run/nginx

COPY ./ingress-ha.conf /etc/nginx/sites-enabled/ingress.conf

WORKDIR /app

# Copy app source
COPY . .

RUN pnpm install turbo -w
RUN pnpm install
RUN pnpm dlx turbo build

EXPOSE 8099

ENV STORAGE_PATH /data/db
ENV SUPERVISOR_URL supervisor/core

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & pnpm start:prod" ]