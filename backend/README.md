# Rentals V2 - Backend

NestJS backend for the Rental Management System.

## Setup

```bash
cd backend
cp .env-example .env   # Edit with your DB credentials
npm install
npm run dev
```

## Docker (local MongoDB)

```bash
docker-compose up -d   # Starts MongoDB + Mongo Express
```

## Scripts

- `npm run dev` - Development with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Run production build
- `npm run lint` - Lint and fix
- `npm run test` - Run tests
