# syntax=docker/dockerfile:1

ARG NODE_VERSION=lts-alpine3.20
# ARG NODE_VERSION=latest
FROM node:${NODE_VERSION}

# Change later to production
ENV NODE_ENV development

WORKDIR /app

# RUN npm install -g @angular/cli@17.3.8

# RUN npm install -g npm@10.8.1

RUN apk add --no-cache tini \
    && mkdir -p /app/.angular/cache \
    && chown -R node:node /app/.angular

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm clean-install
    # npm install

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
# COPY . .

# Expose the port that the application listens on.
EXPOSE 4200

# Tini is PID 1
ENTRYPOINT ["/sbin/tini", "--"]

# Run the application.
CMD [ "npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200" ]


# RUN npm prune --production
# install curl -> when needed

# Alpine Linux Package
# On Alpine Linux, you can use the following command to install Tini:

# RUN apk add --no-cache tini
# # Tini is now available at /sbin/tini
# ENTRYPOINT ["/sbin/tini", "--"]


# CMD
# When creating an image, you can bypass the package.json's start command and bake it directly into the image itself. First off, this reduces the number of processes running inside of your container. Secondly, it causes exit signals such as SIGTERM and SIGINT to be received by the Node.js process instead of npm swallowing them.

# CMD ["node","index.js"]

# docker run \
# --init \
# -e "NODE_ENV=production" \
# -u "node" \
# -m "300M" --memory-swap "1G" \
# -w "/home/node/app" \
# --name "my-nodejs-app" \
# node [script]


# FROM node:alpine as builder

# ## Install build toolchain, install node deps and compile native add-ons
# RUN apk add --no-cache python3 make g++
# RUN npm install [ your npm dependencies here ]

# FROM node:alpine as app

# ## Copy built node modules and binaries without including the toolchain
# COPY --from=builder node_modules .