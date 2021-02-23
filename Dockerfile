# ---- Base Node ----
FROM node:lts AS base
# Create app directory
WORKDIR /src

# ---- Dependencies ----
FROM base AS dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
# install app dependencies including 'devDependencies'
RUN npm install

# ---- Building ----
FROM dependencies AS builder
WORKDIR /app
COPY --from=dependencies /src/package-lock.json ./
COPY --from=dependencies /src/package.json ./
RUN npm ci
COPY src ./src
COPY tsconfig*.json ./
RUN npm run build

# --- Release with Alpine ----
FROM node:12.18.4-stretch-slim

RUN  apt-get update \
  && apt-get install -y wget gnupg ca-certificates \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  # We install Chrome to get all the OS level dependencies, but Chrome itself
  # is not actually used as it's packaged in the node puppeteer library.
  # Alternatively, we could could include the entire dep list ourselves
  # (https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix)
  # but that seems too easy to get out of date.
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/* \
  && wget --quiet https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/sbin/wait-for-it.sh \
  && chmod +x /usr/sbin/wait-for-it.sh

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Create app directory
WORKDIR /app
COPY --from=dependencies /src/package.json ./
# Install app dependencies
RUN npm install --only=production
COPY --from=builder /app/build/main ./
COPY rules ./rules
COPY config ./config

# Add pptr user.
RUN groupadd -r pptruser && useradd -u 1001 -r -g pptruser -G audio,video pptruser \
  && chown -R pptruser:pptruser /app

# Run user as non privileged.
USER pptruser

VOLUME [ "/data" ]

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
