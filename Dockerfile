FROM node:alpine AS build
WORKDIR /src

# Build the client
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Build the server
RUN mkdir -p /src/server
COPY server/package.json server/yarn.lock ./server/
RUN yarn --cwd server install --frozen-lockfile
RUN yarn --cwd server build

FROM node:alpine as final
WORKDIR /app

RUN mkdir -p /app/server
COPY --from=build /src/server/package.json /src/server/yarn.lock /app/server/
RUN yarn --cwd server install --frozen-lockfile
COPY --from=build /src/server/dist /app/server/dist
COPY --from=build /src/dist /app/server/public

EXPOSE 3000

CMD ["yarn", "--cwd", "server", "start:prod"]
