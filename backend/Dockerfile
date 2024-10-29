# build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# prod stage
FROM node:20-alpine

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build /usr/src/app/dist ./dist


# 키 파일들을 Docker 컨테이너의 캐시 디렉토리로 복사
COPY package*.json ./
COPY .env ./

RUN npm install --only=production
RUN rm package*.json

EXPOSE 3001

CMD [ "node", "dist/src/main.js" ]

# docker build -t silent-auction:latest .
# docker run -it -p 3001:3001 --name silent-auction silent-auction:latest
