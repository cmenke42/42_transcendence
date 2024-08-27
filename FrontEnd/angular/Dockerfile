# syntax=docker/dockerfile:1

ARG NODE_VERSION=lts-alpine3.20

FROM node:${NODE_VERSION}

ENV NODE_ENV development

WORKDIR /app

RUN apk add --no-cache tini \
    && mkdir -p /app/.angular/cache \
    && chown -R node:node /app/.angular

# Copy package.json and package-lock.json
COPY ./srcs/package.json ./srcs/package-lock.json ./


RUN npm ci

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY --chown=node:node ./srcs /app

# Expose the port that the application listens on.
EXPOSE 4200

# Tini is PID 1
ENTRYPOINT ["/sbin/tini", "--"]

# Run the application.
CMD [ "npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200" ]
