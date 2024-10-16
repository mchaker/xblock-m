FROM node:lts-alpine

WORKDIR /xblock

COPY package-lock.json .

COPY package.json .

COPY lib /xblock/lib

RUN npm ci