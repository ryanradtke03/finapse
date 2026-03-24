FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install

COPY apps/api ./apps/api

RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

EXPOSE 3001

CMD ["npm", "run", "dev:api"]