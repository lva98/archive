FROM node:12.13.0-alpine
RUN apk add gcc libc-dev
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app 
WORKDIR /home/node/app
COPY package*.json ./
#COPY src/ .
RUN npm install -g supervisor && npm install -g nodemon && npm install
COPY . .
COPY --chown=node:node . .
USER node
EXPOSE 8000
# CMD [ "supervisor", "-e '.' src/app.js" ]
CMD ["nodemon",  "src/server.js"]