# FlyWise - one image that builds the React client and serves it plus the API.
#
# Single stage, deliberately. A builder/runtime split is the obvious instinct,
# but `vite` is a devDependency and is required to build, so the split has to
# carry the dev dependencies anyway. The server also runs through `tsx`, which
# reads the TypeScript sources directly, so there is no compiled artifact to
# copy into a slim runtime stage. Image size is not a constraint here.
FROM node:24-alpine

# Signal handling, so `docker stop` reaches node instead of leaving it to be
# killed. Installed as root, before dropping privileges.
RUN apk add --no-cache dumb-init

WORKDIR /app
RUN chown node:node /app

# Everything below runs as the unprivileged `node` user that the base image
# provides. Doing this before `npm ci` means node_modules is created with the
# right ownership, avoiding a recursive chown layer that would duplicate the
# whole tree and roughly double the image size.
USER node

# Dependency layer, cached independently of source changes. NODE_ENV is not set
# to production here on purpose: npm would then skip devDependencies and the
# vite build below would fail.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

# .dockerignore keeps node_modules, dist, .env* and the ~895 MB CSV out.
COPY --chown=node:node . .

# Vite -> dist/client, which src/server.ts serves. esbuild does not type-check,
# so run `npm run type-check` in CI: a type error cannot fail this build.
RUN npm run build

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
