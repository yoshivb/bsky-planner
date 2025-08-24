#!/usr/bin/env bash
set -e

echo $DATABASE_URL

psql "$DATABASE_URL" << EOF
	CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    content JSONB NOT NULL,
    did TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    repost_dates TIMESTAMP WITH TIME ZONE ARRAY,
    status TEXT NOT NULL
  );
EOF

psql "$DATABASE_URL" << EOF
    CREATE TABLE IF NOT EXISTS reposts (
      id SERIAL PRIMARY KEY,
      did TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
      uri TEXT NOT NULL,
      cid TEXT NOT NULL
    );
EOF

psql "$DATABASE_URL" << EOF
  CREATE TABLE IF NOT EXISTS users (
    did TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    app_password TEXT NOT NULL
  );
EOF