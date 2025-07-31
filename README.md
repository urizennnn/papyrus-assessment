# Esusu Confam API

## Prerequisites

- Node.js v20+
- PostgreSQL 15+
- Yarn

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

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
