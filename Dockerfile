FROM holynoodledev/family-companion:0.2.4b

WORKDIR /app

CMD [ "/bin/bash", "-c", "nginx -g \"daemon off;\" & node ./apps/server/dist/index.js" ]