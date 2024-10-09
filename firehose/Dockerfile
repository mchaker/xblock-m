FROM node:lts-alpine

WORKDIR /app


COPY package.json .

COPY package-lock.json .

COPY index.ts .

RUN npm install

CMD ["npm", "start"]