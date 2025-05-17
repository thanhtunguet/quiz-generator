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

COPY --from=be /src/package.json /app/package.json
COPY --from=be /src/yarn.lock /app/yarn.lock
RUN yarn install --production --frozen-lockfile

COPY --from=be /src/dist /app/dist/
COPY --from=fe /src/dist /app/public/

EXPOSE 3000

CMD ["node", "dist/main.js"]
