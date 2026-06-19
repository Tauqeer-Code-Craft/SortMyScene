# SortMyScene - Event Ticket Booking System

A full-stack Event Ticket Booking System featuring a clean, minimalist white-themed UI inspired by Stripe, Notion, and Linear. The application allows users to view events, select seats from a real-time interactive grid, hold reservations for 10 minutes, and complete bookings atomically.

Built with **React.js (Vite)**, **Node.js + Express.js**, **MongoDB**, **JWT Authentication**, and **Vanilla CSS**.

---

## 🔑 Demo Credentials (For Assessor Review)
Use the following credentials to log in and test all booking, hold reservation, and ticket transaction histories:
- **Email**: `demo@example.com`
- **Password**: `password123`
*(Note: There is also a quick "Auto-fill Demo Credentials" button directly on the Login page for one-click testing!)*

---

## Technical Architecture

```mermaid
graph TD
    Client[React SPA Client] <-->|HTTP / JWT| API[Express API Server]
    API <-->|Mongoose / Queries| DB[(MongoDB Atlas / Local)]
    Worker[Background Expiry Job] -->|Every 30s| DB
```

---

## Core Features

1. **Interactive Seating Grid**: A 60-seat grid (6 rows, 10 columns) with real-time seat availability color-coding.
2. **Atomic 10-Minute Hold**: Places selected seats in a temporary reservation state, preventing other users from claiming them while checkout is in progress.
3. **Live Seat Availability Refresh**: Automatically polls seat status from the API every 15 seconds. If a locally selected seat is booked by someone else in the background, a warning banner appears and the seat is deselected.
4. **Interactive Analytics Cards**: Shows Total, Available, Reserved, and Booked seats dynamically, updating in real time.
5. **MongoDB Transactions**: Guarantees zero double-booking by locking and updating seat states inside atomic database sessions.

---

## Design System (Vanilla CSS)
The visual interface strictly follows the design requirements, avoiding gradients, flashy animations, neon colors, and glassmorphism:
- **Base Background**: White (`#FFFFFF`)
- **Card/Header Surfaces**: Slate Gray (`#F8FAFC`)
- **Primary Text**: Slate Dark (`#1E293B`)
- **Secondary Text**: Muted Blue-Gray (`#64748B`)
- **Accent Theme**: Stripe Blue (`#2563EB`)
- **Seat Legends**: Available (White/Border), Selected (Stripe Blue), Reserved (Orange), Booked (Red)

---

## Setup & Installation

### Local Development Setup
1. **Prerequisites**: Ensure you have Node.js (v18+) and your MongoDB Atlas cluster URI.
2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a backend/.env file with the following variables:
   PORT=5000
   MONGODB_URI=mongodb+srv://TauqeerAhmad:Test123@cluster0.dc5wogl.mongodb.net/sortmyscene?retryWrites=true&w=majority
   JWT_SECRET=super_secret_jwt_key_123_abc_xyz
   NODE_ENV=development
   
   # Run the seeding script to populate events, users, and pre-booked seats:
   npm run seed
   
   # Start the Express API server:
   npm start
   ```
3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   # Start the Vite local development server:
   npm run dev
   ```
   *The React client runs on `http://localhost:5173`. Any relative `/api/*` call is automatically proxied to the Express backend on `http://localhost:5000/api/*` via the Vite proxy settings in `vite.config.js`.*

---

## 🚀 Unified Deployment on Vercel
You can deploy both the React frontend and Express backend **together in a single Vercel project** using the root `vercel.json` configurations:

1. **Push your code to GitHub** (make sure your repo root matches your project root).
2. **Import the repository** into Vercel.
3. In the project creation page:
   - Keep the **Root Directory** as the repository root (do not change it to `frontend` or `backend`).
   - Vercel will automatically read the root `vercel.json`, deploy the Express backend as serverless functions, and trigger the React static build.
4. Add the following **Environment Variables** in the Vercel project settings:
   - `MONGODB_URI`: `mongodb+srv://TauqeerAhmad:Test123@cluster0.dc5wogl.mongodb.net/sortmyscene?retryWrites=true&w=majority`
   - `JWT_SECRET`: `super_secret_jwt_key_123_abc_xyz`
5. Click **Deploy**. Vercel will build both, hosting the frontend statically at the root domain and routing all `/api/*` requests to the Express serverless function on the same domain automatically!

---

## API Documentation

### Authentication Routes
- **POST `/api/auth/register`**
  - Registers a new user.
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
  - Response: `{ "_id": "...", "name": "...", "email": "...", "token": "JWT_TOKEN" }`

- **POST `/api/auth/login`**
  - Logs in an existing user.
  - Body: `{ "email": "john@example.com", "password": "password123" }`
  - Response: `{ "_id": "...", "name": "...", "email": "...", "token": "JWT_TOKEN" }`

### Events & Seats Routes
- **GET `/api/events`**
  - Retrieves all events along with their live available seat counts.
  - Response: Array of event objects.

- **GET `/api/events/:id`**
  - Retrieves detailed information for a single event.

- **GET `/api/events/:id/seats`**
  - Retrieves the seat map grid status for the event.
  - Returns a list of 60 seats (A1-F10) with statuses (`available`, `reserved`, `booked`).

### Protected Checkout Routes (Requires Bearer Token)
- **POST `/api/reserve`**
  - Places a 10-minute hold on one or more available seats.
  - Body: `{ "eventId": "EVENT_OBJECT_ID", "seatNumbers": ["A1", "A2"] }`
  - Response: `{ "message": "...", "reservationId": "...", "expiresAt": "TIMESTAMP", "seatNumbers": [...] }`

- **POST `/api/bookings`**
  - Confirms and pays for a ticket hold, converting the reservation into a permanent booking.
  - Body: `{ "reservationId": "RESERVATION_OBJECT_ID" }`
  - Response: `{ "message": "...", "bookingId": "BK-XXXXXX", "seatNumbers": [...], "bookedAt": "...", "event": { ... } }`

---

## Critical Design Decisions

### 1. Preventing Double Booking via Transactions
To guarantee two users cannot book the same seat simultaneously, the booking flow uses MongoDB multi-document transactions.
- **Seat States**: A seat can only transition from `available` -> `reserved` -> `booked`.
- **Session Isolation**: When confirming a booking, Mongoose starts a session transaction. It verifies the reservation's authenticity and user ownership, converts seat statuses to `booked`, creates the booking receipt, and deletes the reservation log.
- **Rollback Guarantee**: If any check fails, or if a network crash occurs midway, the transaction is automatically aborted, and all updates roll back, ensuring zero seat leakage or double allocation.

### 2. Reservation Expiry Handling
Reservations are held for exactly 10 minutes.
- **Background Worker**: A periodic cleaner runs every 30 seconds inside `server.js` executing a database query:
  `Reservation.find({ expiresAt: { $lte: new Date() } })`
  It reverts matching seats back to `available` and purges the reservation records.
- **On-Demand Expiry**: To prevent edge cases where a user requests seats before the background worker runs, the `/api/events/:id/seats` endpoint triggers a localized cleanup before returning seat details. This guarantees the client interface is always 100% accurate.

### 3. Authentication Strategy
Secure user state is maintained via JSON Web Tokens (JWT).
- The token is generated on registration or login and saved in the client's `localStorage`.
- A request interceptor in the Axios service layer automatically appends the token in the `Authorization: Bearer <token>` header for all API calls.
- Key endpoints like `/api/reserve` and `/api/bookings` parse this token and verify ownership, preventing cross-user reservation hijackings.

### 4. Seat Availability Refresh Strategy
Rather than complex WebSockets which can load server resources, we implement a highly efficient **15-second polling system** on the Seat Selection page:
- The seat grid state is re-fetched in the background.
- If a user has seats selected locally (but not yet checked out) and another user reserves or books them, the background refresh automatically detects this, removes them from the selection, and displays a warning banner: *"The following seat(s) became unavailable and were removed: A1"*.

---

## Assumptions Made
1. **Seat Pricing**: Tickets are assumed to be uniform in price, or priced by row (A-F). The client shows seat count summaries.
2. **User Reservations**: A user can only have one active reservation at a time for any single event. Reserving a new set of seats automatically releases their previous reservation to keep the database tidy.
3. **Stand-alone local DB**: When testing transactions on local developer setups, MongoDB must run as a single-node replica set. Connecting to MongoDB Atlas clusters supports transactions by default.
