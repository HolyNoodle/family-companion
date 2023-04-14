FROM node:16

RUN npm i -g pnpm
 
WORKDIR /app
  
# Copy app source
COPY . .

RUN pnpm install
RUN pnpm build
 
EXPOSE 7000

ENV PORT 7000
ENV STORAGE_PATH /data/db
 
CMD [ "node", "apps/back/dist/index.js" ]