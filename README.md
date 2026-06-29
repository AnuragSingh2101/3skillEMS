# Event Management System (Evently)

A premium, full-stack event experiences exploration, booking, and check-in management system built with **React**, **Node.js**, **Express**, and **MongoDB** (with auto-fallback to in-memory store for instant zero-dependency testing).

## Features

1. **Vibrant Aesthetics**: Modern dark mode UI with fluid layout animations, glassmorphism card components, and hover glow effects.
2. **Search & Categories Discovery**: Filter and keyword search for listed concerts, tech talks, art exhibitions, and conferences.
3. **Seating capacity tracker**: Prevents booking when capacity is reached.
4. **Stripe Payments (Simulated sandbox)**: Fully functional checkout billing flow built directly into the client detail purchase steps.
5. **QR Code Entry Passes**: Automatically generates secure scanning codes (base64) matching confirmed seats.
6. **Mobile Check-in Scan**: Device camera integrations to read entry tickets and admit attendees securely with color signals.
7. **Organizer Analytics**: Rich panels reporting sales growth metrics, daily ticket distributions, and individual listing revenues via lightweight interactive SVG charts.

---

## Installation & Launch

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (which includes npm).

### 1. Install all dependencies
In the root directory, run:
```bash
npm run install-all
```
*This command triggers the sub-dependency builds for both `/frontend` and `/backend` concurrently.*

### 2. Start servers concurrently
Run the concurrent dev command:
```bash
npm run dev
```
- **React Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Node/Express API Server**: [http://localhost:5000](http://localhost:5000)

---

## Technical Setup & Database Connection

- **Environment config**: To customize ports, DB connections, or add Stripe keys, adjust the fields inside `backend/.env`.

---