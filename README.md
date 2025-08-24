# The Bsky Planner

Plan your Bluesky posts and reposts in advance, fully self-hosted & contained, and no extra TOS to deal with!

## Setup

_-- WIP --_

Install dependencies and build the docker image:

```bash
pnpm install
pnpm run export
```

Upload the image to your docker environment and use this docker compose:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-bluesky}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-bluesky}
      POSTGRES_DB: ${POSTGRES_DB:-bluesky_planner}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${POSTGRES_USER:-bluesky} -d ${POSTGRES_DB:-bluesky_planner}",
        ]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    image: yoshivb/bsky-planner:latest
    environment:
      DATABASE_URL: ${DATABASE_URL:-postgres://bluesky:bluesky@postgres:5432/bluesky_planner}
      NUXT_SESSION_PASSWORD: #Fill in a password here!
    depends_on:
      - postgres
    ports:
      - "3002:3000"

volumes:
  postgres_data:
```