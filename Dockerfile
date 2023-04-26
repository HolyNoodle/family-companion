FROM holynoodledev/family-companion

WORKDIR /app

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]