# Unified Ambulance System

Real-time ambulance dispatch platform with **USER**, **DRIVER**, and **ADMIN** roles.

## Tech

- **Frontend**: React (hooks), React Router, Axios, Tailwind CSS, Leaflet + OpenStreetMap
- **Backend**: Node.js + Express, PostgreSQL + Prisma, JWT auth, bcrypt hashing, Socket.io

## Setup (Windows / PowerShell)

### 1) Prereqs

- Node.js 18+ (recommended)
- PostgreSQL running locally

### 2) Configure environment

Create `server/.env` based on `server/.env.example`.

### 3) Install dependencies

```bash
npm install
```

### 4) Create DB + migrate + seed

```bash
npx prisma migrate dev --schema server/prisma/schema.prisma
npx prisma db seed --schema server/prisma/schema.prisma
```

### 5) Run the app

```bash
npm run dev
```

- Client: `http://localhost:3000`
- Server: `http://localhost:5000`

## Seed accounts

Seed data creates:

- **Admin**: `admin@uas.local` / `Admin@12345`
- **Driver** (example): `driver1@uas.local` / `Driver@12345`
- **User** (example): `user1@uas.local` / `User@12345`

You can also register new users/drivers from the UI.

