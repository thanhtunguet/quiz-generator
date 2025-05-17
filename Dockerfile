FROM node:alpine AS fe
WORKDIR /src

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:alpine AS be
WORKDIR /src

COPY server/package.json server/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY server/ .

RUN yarn build

FROM node:alpine AS final
WORKDIR /app

COPY --from=be /src/dist /src/package.json src/yarn.lock ./dist/
RUN yarn install --frozen-lockfile --production

COPY --from=fe /src/dist /app/public/

EXPOSE 3000

CMD ["node", "dist/main.js"]
