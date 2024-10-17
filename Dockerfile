FROM node:lts

WORKDIR /xblock

COPY package-lock.json .

COPY package.json .

RUN npm ci

COPY lib /xblock/lib

