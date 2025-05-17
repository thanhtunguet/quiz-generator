FROM node:alpine AS FE
WORKDIR /src

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:alpine AS BE
WORKDIR /src

COPY server/package.json server/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY server/ .

RUN yarn build

FROM node:alpine AS final
WORKDIR /app

COPY --from=BE /src/dist /src/package.json src/yarn.lock ./dist/
RUN yarn install --frozen-lockfile --production

COPY --from=FE /src/dist /app/public/

EXPOSE 3000

CMD ["node", "dist/main.js"]
