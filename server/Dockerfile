FROM node:12.13.0-alpine
RUN apk add gcc libc-dev
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app 
RUN mkdir -p /home/node/arquivos && chown -R node:node /home/node/arquivos 
RUN mkdir -p /home/node/app/src && chown -R node:node /home/node/app/src
 
WORKDIR /home/node/app
COPY src/* ./src/
COPY package.json .
RUN npm install -g nodemon && npm install /home/node/app/
COPY --chown=node:node . .
USER node

EXPOSE 8080
CMD ["nodemon",  "src/server.js"]