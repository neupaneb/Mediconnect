# MediConnect

MediConnect is a hospital-style patient portal built with Flask (backend) and React (frontend).The goal of this project is to simulate a real-world healthcare management system with authentication, role-based access, and modular feature development.

---

## ✅ Completed

- User registration
- User login & logout
- JWT-based authentication
- Role-based access (Patient / Staff)
- Protected frontend routes
- Basic dashboard UI

---

## 🚧 In Progress

- Appointment booking system
- Lab results management
- Ticketing system
- AI-assisted scheduling
- Analytics dashboard

---

## Tech Stack

**Backend**

- Flask
- SQLAlchemy
- JWT Authentication
- SQLite (development)

**Frontend**

- React (Vite)
- Context API for auth state
- Protected routing

## What You Need

### Prerequisites

- **Node.js** 18+ (for React frontend)
- **Python** 3.10+ (for Flask backend)

### Install Dependencies

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**

```bash
cd frontend
npm install
```

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

- Backend: http://localhost:5001
- Frontend: http://localhost:5173

### Seed Test Data

```bash
cd backend
python seed.py
```
