FROM --platform=linux/amd64 holynoodledev/family-companion:0.1.5a

WORKDIR /app

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]