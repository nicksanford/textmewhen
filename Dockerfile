FROM node
ENTRYPOINT [ "node", "/app/main.js" ]
ADD . /app/
WORKDIR /app
RUN npm install --save
