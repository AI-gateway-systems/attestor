## Attestor — Production Container
##
## Multi-stage build: compile TypeScript → slim runtime image
## Used by both API and Worker services (different CMD)
##
## API:    docker run attestor node dist/service/api-server.js
## Worker: docker run attestor node dist/service/worker.js

FROM node:26-alpine@sha256:30f5a66e7265ef70aac56b4753ffa7905e54eca1084bc25503893ad8e9273f05 AS build
WORKDIR /app
ENV REDISMS_DISABLE_POSTINSTALL=true
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY src/ src/
RUN npm run build && npm prune --production

FROM node:26-alpine@sha256:30f5a66e7265ef70aac56b4753ffa7905e54eca1084bc25503893ad8e9273f05
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
ENV NODE_ENV=production
USER node
EXPOSE 3700
CMD ["node", "dist/service/api-server.js"]
