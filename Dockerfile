FROM holynoodledev/family-companion:0.1.9a

WORKDIR /app

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]