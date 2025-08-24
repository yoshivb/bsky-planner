FROM node:20 AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install packages
COPY package*.json pnpm-lock.yaml ./
ENV ROLLUP_SKIP_NODE_RESOLVE=true
COPY . .
RUN pnpm install --frozen-lockfile

# Install postgresql client
RUN apt-get update && apt-get install postgresql -y

# Build
RUN pnpm run build

# Run
CMD [ "/app/scripts/start.sh" ]