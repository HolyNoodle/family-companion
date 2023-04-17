FROM node:18

RUN npm i -g pnpm
 
WORKDIR /app

EXPOSE 7000
EXPOSE 7001

ENV STORAGE_PATH /data/db

CMD [ "pnpm", "dev" ]