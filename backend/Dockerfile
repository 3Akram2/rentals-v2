# Stage 1: Development
FROM node:22.15.0-alpine3.21 AS development

WORKDIR /app

COPY package*.json ./
RUN yarn

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22.15.0-alpine3.21 AS production

WORKDIR /app

COPY --from=development /app/package*.json ./
COPY --from=development /app/yarn.lock ./
RUN yarn install --production

COPY --from=development /app/dist ./dist
COPY --from=development /app/.env ./.env

VOLUME [ "/app/dist/runtime" ]

EXPOSE 4040

CMD ["node", "dist/main"]
