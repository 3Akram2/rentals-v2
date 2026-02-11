# Rentals V2

Production-ready rental property management system (EN/AR) with Dockerized frontend/backend and cloud MongoDB support.

---

## Tech Stack

- **Backend:** NestJS, JWT auth, role/permissions, Mongoose
- **Frontend:** React + Vite, bilingual (English/Arabic), RTL support
- **Infra:** Docker Compose, Caddy reverse proxy, HTTPS
- **Database:** MongoDB (Atlas/cloud preferred in prod; local container optional)

---

## Core Features

- Building and property management (apartments/stores)
- Payment tracking with monthly records
- Receipt generation (Arabic legal format)
- Ownership division by kirats with group/member breakdown
- Expense tracking per building/year
- Yearly financial reports with net income calculations
- Owner payout reporting
- Tenant/user management linked to buildings/properties
- Admin user management with RBAC
- Profile page (photo upload + password update)
- Login page with logo animation and language toggle

---

## Project Structure

```txt
rentals-v2/
├── backend/
│   ├── src/
│   │   ├── app-auth/
│   │   ├── buildings/
│   │   ├── properties/
│   │   ├── payments/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── users/
│   │   ├── rental-users/
│   │   ├── groups/
│   │   └── users-group/
│   └── .env-example
├── frontend/
│   ├── src/
│   └── public/
├── deploy/
│   └── Caddyfile
├── docker-compose.yaml         # local/dev stack
└── docker-compose.prod.yml     # production stack
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Docker + Docker Compose plugin

### Backend

```bash
cd backend
cp .env-example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Optional Local MongoDB

```bash
docker compose -f docker-compose.yaml up -d
```

---

## Production Deployment

> Current production topology uses a dedicated edge reverse-proxy service and separate app services.

### Run app containers

```bash
cd /home/omar/projects/rentals-v2
docker compose -f docker-compose.prod.yml up -d --build
```

### Run reverse proxy (edge)

```bash
cd /home/omar/projects/reverse-proxy
docker compose up -d
```

### Verify

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

---

## Environment Variables (Backend)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `production` |
| `DB_URL` | MongoDB connection URI | `mongodb+srv://...` |
| `DB_NAME` | Database name | `rentals` |
| `DB_USER` | DB username (optional) | `admin` |
| `DB_PASSWORD` | DB password (optional) | `***` |
| `JWT_SECRET` | JWT signing secret | `***` |

---

## Roles

| Role | Access |
|---|---|
| `SuperAdmin` | Full system access |
| `Admin` | Full operational access |
| `Viewer` | Read-only access |

---
