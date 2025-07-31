# Esusu Confam API

## Prerequisites

- Node.js v20+
- PostgreSQL 15+
- Yarn

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

Required variables:

- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `JWT_SECRET_KEY`

## Setup

```bash
yarn install
```

## Database

Run migrations:

```bash
yarn migration:run
```

Seed data (optional):

```bash
node dist/seed.js
```

## Development

Start the server in watch mode:

```bash
yarn start:dev
```

Open API docs at `http://localhost:8080/docs`.

## Core Routes

- `POST /auth/register` – create an account
- `POST /auth/login` – obtain JWT tokens
- `POST /auth/refresh` – refresh access token
- `GET /users/me` – view your profile
- `PATCH /users/me` – update profile
- `POST /groups` – create a group
- `GET /groups` – list groups
