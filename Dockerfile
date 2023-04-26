FROM holynoodledev/family-companion:0.10

WORKDIR /app

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]