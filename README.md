# Rentals V2

Full-stack rental property management system with bilingual support (English/Arabic).

## Tech Stack

- **Backend:** NestJS, MongoDB (Mongoose), JWT Authentication, Role-based Permissions
- **Frontend:** React (Vite), Bilingual EN/AR with RTL support

## Features

- Building and property management (apartments & stores)
- Payment tracking with monthly records
- Receipt generation (Arabic legal format)
- Ownership division by kirats with group/member breakdown
- Expense tracking per building per year
- Yearly financial reports with net income calculation
- Payout reports per owner
- User management (rental tenants linked to properties/buildings)
- Admin user management with role-based access (SuperAdmin, Admin, Viewer)
- Profile page with photo upload and password change
- Login with logo and language toggle

## Project Structure

```
rentals-v2/
├── backend/          # NestJS API server
│   ├── src/
│   │   ├── app-auth/         # JWT auth, guards, permissions
│   │   ├── buildings/        # Building CRUD
│   │   ├── properties/       # Property CRUD
│   │   ├── payments/         # Payment CRUD
│   │   ├── expenses/         # Expense CRUD
│   │   ├── reports/          # Yearly reports
│   │   ├── users/            # Admin user accounts
│   │   ├── rental-users/     # Tenant/owner records
│   │   ├── groups/           # Role groups & permissions
│   │   └── users-group/      # User grouping
│   └── .env-example
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/       # All UI components
│   │   ├── context/          # Auth & Language contexts
│   │   ├── api/              # API client
│   │   └── i18n/             # EN/AR translations
│   └── public/
└── docker-compose.yaml       # Local MongoDB + Mongo Express
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local via Docker or Atlas connection)

### 1. Backend

```bash
cd backend
cp .env-example .env    # Edit with your DB credentials
npm install
npm run dev             # Starts on port 4001
```

On first run, the migration seeds:
- **SuperAdmin**, **Admin**, and **Viewer** role groups
- Default admin account: `admin@rentals.local` / `admin123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev             # Starts on port 4002
```

### 3. Local MongoDB (optional)

```bash
docker-compose up -d    # MongoDB on 27018, Mongo Express on 8082
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `DB_URL` | MongoDB connection URI | `mongodb://admin:admin@localhost:27017/` |
| `DB_NAME` | Database name | `rentals` |
| `DB_USER` | DB username (if not in URI) | `admin` |
| `DB_PASSWORD` | DB password (if not in URI) | `admin` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-here` |

## Roles & Permissions

| Role | Access |
|------|--------|
| **SuperAdmin** | Full access to all features |
| **Admin** | Full access to all features |
| **Viewer** | Read-only access to buildings, properties, payments, expenses, reports, and users |
