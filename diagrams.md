# Unified Ambulance System — Design Diagrams (Mermaid)

This file matches the **simple, readable style** used in `explanation.md`: a few nodes per diagram, clear labels, and flows that mirror the real code (`client/`, `server/`, Prisma, Socket.io).

---

## 1. System Architecture Diagram

Same structure as **Section 4** in `explanation.md`, with Prisma called out on the database link so it is obvious how data is stored.

```mermaid
flowchart LR
  U[User Browser] -->|REST + Socket.io| FE[React Frontend]
  D[Driver Browser] -->|REST + Socket.io| FE
  A[Admin Browser] -->|REST| FE

  FE -->|REST calls + JWT| API[Express API]
  FE -->|socket events| SO[Socket.io Server]
  API -->|Prisma ORM| DB[(PostgreSQL)]
  SO -->|real-time push| FE
```

**Explanation:**

- **What it represents:** Who talks to what at a glance: three browsers, one React app, one API, one Socket server, one database.
- **Components:** React (`client`), Express routes under `/auth`, `/request`, `/driver`, `/admin` (`server/server.js`), Socket.io (`server/sockets/index.js`), Prisma + PostgreSQL.
- **How it works:** REST carries most commands (create request, accept, location update, admin lists). Socket.io pushes `new_request`, `request_accepted`, `location_update`, and `request_completed` back to the right browser without extra polling.

---

## 2. Use Case Diagram

A compact **flowchart** (easy to render everywhere). Each box is something the code actually supports.

```mermaid
flowchart TB
  subgraph Actors
    user((User))
    driver((Driver))
    admin((Admin))
  end

  subgraph App["What the system does"]
    uc1[Register / Login]
    uc2[Create ambulance request lat,lng]
    uc3[See status and live map]
    uc4[See incoming requests in real time]
    uc5[Accept or reject]
    uc6[Send location updates]
    uc7[Mark trip completed]
    uc8[Admin login]
    uc9[View all requests]
    uc10[Filter stats on dashboard]
    uc11[View drivers and ambulances]
  end

  user --> uc1
  user --> uc2
  user --> uc3
  driver --> uc1
  driver --> uc4
  driver --> uc5
  driver --> uc6
  driver --> uc7
  admin --> uc8
  admin --> uc9
  admin --> uc10
  admin --> uc11
```

**Explanation:**

- **What it represents:** The three roles and the main goals tied to your pages and APIs.
- **Components:** User flows (`RegisterPage`, `LoginPage`, `RequestAmbulancePage`, `UserDashboard`, `TrackingPage`); Driver (`DriverDashboard` + `/driver/*`); Admin (`AdminLoginPage`, `AdminDashboard` + `/admin/*`).
- **How it works:** Users drive requests and tracking; drivers react and send GPS; admins read global data. Filtering by Total/Active/Completed is done in the browser on data from `GET /admin/requests`.

---

## 3. Class Diagram

Only the **four Prisma models** and how they link. Field names match `server/prisma/schema.prisma`.

```mermaid
classDiagram
  class User {
    +id
    +name
    +email
    +password
    +role
  }

  class Ambulance {
    +id
    +driverId
    +lat
    +lng
    +available
    +status
  }

  class Request {
    +id
    +userId
    +lat
    +lng
    +status
    +ambulanceId
  }

  class LocationUpdate {
    +id
    +ambulanceId
    +lat
    +lng
    +timestamp
  }

  User "1" --> "0..*" Request
  User "1" --> "0..1" Ambulance
  Ambulance "1" --> "0..*" Request
  Ambulance "1" --> "0..*" LocationUpdate
```

**Explanation:**

- **What it represents:** The database “classes” your app persists through Prisma.
- **Components:** `User`, `Ambulance`, `Request`, `LocationUpdate`.
- **How it works:** A user places many requests over time. Each driver user has at most one ambulance. A request may have no ambulance yet (`ambulanceId` null) until dispatch assigns one. Each location ping stores one `LocationUpdate` row.

---

## 4. Sequence Diagram

Two short sequences (same ideas as **Sections 8–9** in `explanation.md`): first **create + dispatch**, then **accept + live tracking + complete**.

### 4a. Create request and notify driver

```mermaid
sequenceDiagram
  participant U as User
  participant API as Express API
  participant DB as Prisma + Postgres
  participant S as Socket.io
  participant D as Driver

  U->>API: POST /request/create (lat,lng)
  API->>DB: read available ambulances
  API->>API: pick nearest (Haversine)
  API->>DB: save Request + lock ambulance if any
  API->>S: emit new_request to user:driverId
  S-->>D: new_request
  API-->>U: 201 + request JSON
```

### 4b. Accept, live location, complete

```mermaid
sequenceDiagram
  participant U as User
  participant API as Express API
  participant S as Socket.io
  participant D as Driver

  D->>API: POST /driver/accept (accept)
  API->>S: emit request_accepted to user:userId
  S-->>U: request_accepted

  loop while trip is active
    D->>API: POST /driver/location-update (lat,lng)
    API->>S: emit location_update to user:userId
    S-->>U: location_update
  end

  D->>API: POST /driver/complete (requestId)
  API->>S: emit request_completed to user:userId
  S-->>U: request_completed
```

**Explanation:**

- **What it represents:** The main time order of messages for dispatch and tracking.
- **Components:** User and driver UIs, `requestController` / `driverController`, Prisma, Socket.io rooms `user:<id>`.
- **How it works:** HTTP writes state; Socket.io tells the other party immediately. The tracking page (`TrackingPage.js`) listens for `location_update` and moves the map marker.

---

## 5. Activity Diagram

Straight-line story with one branch for “no ambulance free at first” and a small note for **idle reassignment** (implemented in `driverController.js`).

```mermaid
flowchart TD
  start([User requests ambulance]) --> coords[Set lat / lng]
  coords --> api[POST /request/create]
  api --> pick{Nearest free ambulance?}
  pick -->|Yes| assign[Save request with ambulanceId]
  pick -->|No| wait[Save request without ambulanceId]
  assign --> notify[Socket: new_request to driver]
  wait --> pool([Waits until a driver becomes idle])
  notify --> driver{Driver accepts?}
  driver -->|Yes| enroute[Status accepted, ambulance enroute]
  driver -->|No| rejected[Status rejected, ambulance idle]
  rejected --> maybe[If pending requests exist, server may assign next nearest]
  enroute --> track[User opens live map]
  track --> loop[Driver sends location-update repeatedly]
  loop --> done{Driver marks completed?}
  done -->|No| loop
  done -->|Yes| idle[Ambulance idle again]
  idle --> maybe
```

**Explanation:**

- **What it represents:** The life of one request from submit to finish.
- **Components:** `createRequest`, `acceptRequest`, `locationUpdate`, `completeRequest`, plus `assignPendingRequestToIdleAmbulance` after reject/complete.
- **How it works:** Happy path: assign → notify → accept → location loop → complete. If no ambulance was free, the request stays unassigned until an ambulance goes idle and the server assigns the closest waiting `pending` request.

---

## 6. Collaboration Diagram

Who sends messages to whom (objects / layers), kept flat like a classic collaboration view.

```mermaid
flowchart LR
  subgraph Clients
    UI[React pages]
  end
  subgraph Server
    R[routes + JWT middleware]
    C[controllers]
    SK[Socket.io]
    P[Prisma client]
  end
  DB[(PostgreSQL)]

  UI -->|HTTP| R
  R --> C
  C --> P
  P --> DB
  C -->|emit| SK
  SK -->|events| UI
  UI -->|WebSocket| SK
```

**Explanation:**

- **What it represents:** Communication paths instead of internal class details.
- **Components:** React UI, Express routes, controllers, Prisma, Socket.io, PostgreSQL.
- **How it works:** UI always goes through HTTP or WebSocket to the server. Controllers read/write via Prisma and optionally notify via Socket.io.

---

## 7. Entity Relationship (ER) Diagram

Relationships first; a short attribute list per table so the diagram stays readable.

```mermaid
erDiagram
  USER ||--o{ REQUEST : creates
  USER ||--o| AMBULANCE : drives_one
  AMBULANCE ||--o{ REQUEST : serves
  AMBULANCE ||--o{ LOCATION_UPDATE : logs

  USER {
    string id PK
    string email UK
    string role
  }

  AMBULANCE {
    string id PK
    string driverId FK
    boolean available
  }

  REQUEST {
    string id PK
    string userId FK
    string status
    string ambulanceId
  }

  LOCATION_UPDATE {
    string id PK
    string ambulanceId FK
    datetime timestamp
  }
```

**Explanation:**

- **What it represents:** Tables and how rows reference each other (same as Prisma schema).
- **Components:** `User`, `Ambulance`, `Request`, `LocationUpdate`.
- **How it works:** Every request belongs to one user. Optional `ambulanceId` means “not dispatched yet.” Location updates always belong to one ambulance.

---

## Alignment with `explanation.md`

| Topic | Where it is detailed in prose |
|-------|-------------------------------|
| Architecture (simple) | `explanation.md` Section 4 |
| Dispatch sequence | `explanation.md` Section 8 |
| Live tracking sequence | `explanation.md` Section 9 |
| APIs and sockets | `explanation.md` Sections 6–7 |

If a Mermaid preview fails in one tool, paste the block into [Mermaid Live Editor](https://mermaid.live) to validate syntax.
