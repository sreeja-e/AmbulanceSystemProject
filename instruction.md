Build a complete full-stack project called "Unified Ambulance System" using the following stack:

Frontend:

React.js (functional components + hooks)
React Router
Axios for API calls
Tailwind CSS or simple CSS modules

Backend:

Node.js + Express.js
PostgreSQL with Prisma ORM
JWT Authentication
Bcrypt password hashing
Socket.io for real-time communication

Maps:

Leaflet.js with OpenStreetMap (for live tracking visualization)

📌 PROJECT DESCRIPTION

Develop a real-time emergency response system where users can request ambulances and drivers can accept requests and provide live location updates.

The system should simulate a real-world ambulance dispatch platform similar to Uber.

There are 3 roles:

User → can request ambulance and track it
Driver → can accept/reject requests and send live location
Admin → can monitor all activities

📌 FEATURES REQUIRED

USER SIDE

Register (name, email, password)
Login
Request ambulance (send current location: latitude & longitude)
View request status:
  Pending → Accepted → Completed
Track ambulance live on map
Logout

DRIVER SIDE

Register/Login as driver
View incoming ambulance requests (real-time)
Accept / Reject requests
Send live location updates (every few seconds)
View assigned request details
Mark request as completed

ADMIN SIDE

Admin Login
Admin Dashboard
View all ambulance requests
View all drivers and ambulances
Monitor active requests

📌 BACKEND DETAILS

Create the following routes:

Auth Routes:
POST /auth/register
POST /auth/login

User Routes:
POST /request/create
GET /request/:id

Driver Routes:
GET /driver/requests
POST /driver/accept
POST /driver/location-update
POST /driver/complete

Admin Routes:
POST /admin/login
GET /admin/requests
GET /admin/drivers

📌 DATABASE DESIGN (PRISMA)

Create models:

User:
- id
- name
- email
- password
- role (USER, DRIVER, ADMIN)

Ambulance:
- id
- driverId
- lat
- lng
- available (boolean)
- status

Request:
- id
- userId
- lat
- lng
- status (pending, accepted, completed)
- ambulanceId
- createdAt

LocationUpdate:
- id
- ambulanceId
- lat
- lng
- timestamp

📌 CORE LOGIC (VERY IMPORTANT)

When user creates a request:

1. Fetch all available ambulances
2. Calculate distance using Haversine formula
3. Select nearest ambulance
4. Assign request to that driver
5. Notify driver using Socket.io

📌 REAL-TIME FEATURES (Socket.io)

Implement events:

- new_request → send to drivers
- request_accepted → notify user
- location_update → live tracking
- request_completed → notify user

Frontend must listen to these events and update UI instantly.

📌 MAP FEATURES (Leaflet)

Display:

- User location
- Ambulance location (live updates)
- Update markers dynamically

📌 FRONTEND REQUIREMENTS

Pages to Create:

Landing Page
Register
Login
User Dashboard
Request Ambulance Page
Tracking Page (Map view)
Driver Dashboard
Admin Login
Admin Dashboard

UI Requirements:

Clean modern UI
Responsive design
Status indicators (Pending / Accepted / Completed)
Map with live updates
Navbar with logout

📁 FOLDER STRUCTURE REQUIRED

/client (React frontend)
  /src
    /pages
    /components
    /services (axios API calls)
    /context (Auth Context)
    App.js
    index.js

/server (Backend)
  /prisma
  server.js
  /routes
  /controllers
  /models (if needed)
  /middleware
  /utils (distance calculation)
  /sockets

📌 SECURITY

Use JWT authentication middleware
Role-based authorization (USER, DRIVER, ADMIN)
Hash passwords using bcrypt
Validate all inputs

📌 SEED DATA

Add sample drivers and ambulances in database

📌 RUN INSTRUCTIONS

Project should run with:

npm install
npx prisma migrate dev
npm run dev

📌 DELIVERABLE

Generate the ENTIRE full-stack application, including:

All React components with routing
Axios API service files
Express.js backend with controllers and routes
Prisma schema and database setup
JWT authentication and role-based middleware
Socket.io integration for real-time updates
Leaflet map integration
Clean UI with styling
README with setup instructions
.env.example file

Ensure the project is fully functional, error-free, and ready to run immediately.