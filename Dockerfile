FROM node:18

RUN npm i -g pnpm
 
WORKDIR /app

EXPOSE 7000
EXPOSE 7001

ENV STORAGE_PATH /data/db
# ENV SUPERVISOR_URL ws://supervisor/core/websocket
ENV SUPERVISOR_URL ws://192.168.1.35:8123/api/websocket
ENV SUPERVISOR_TOKEN eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI3ODRlYjdiYjhkN2Q0ZTA0YTA4MDc3MmU5N2U1NGRjYSIsImlhdCI6MTY4MTczNjIyNCwiZXhwIjoxOTk3MDk2MjI0fQ.DTVGs1mTT8276aFgT64KxCUlZPqX5gPbCGYBNkyV4Wo

CMD [ "pnpm", "dev" ]