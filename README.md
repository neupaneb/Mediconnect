# MediConnect

MediConnect is a hospital-style patient portal built with Flask on the backend and React on the frontend. The project is designed to simulate a real-world healthcare management system with authentication, role-based access, and modular feature development for both patients and staff.

## ✅ Completed

- User registration
- User login & logout
- JWT-based authentication
- Role-based access (Patient / Staff)
- Protected frontend routes
- Patient dashboard UI
- Staff dashboard UI
- Ticketing system
- Appointment booking system
- Lab results management
- Staff availability management
- Analytics export endpoints

## 🚧 In Progress

- AI-assisted scheduling
- Final UI polish and integration cleanup

## Tech Stack

### Backend

- Flask
- SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- JWT Authentication
- SQLite (development)

### Frontend

- React (Vite)
- React Router
- Context API for auth state
- Protected routing

## What You Need

### Prerequisites

- Node.js 18+ (for React frontend)
- Python 3.10+ (for Flask backend)
- `pip` for Python package installation
- `npm` for frontend dependencies

## Install Dependencies

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` if you do not already have one. You can copy the example:

```bash
cp .env.example .env
```

Example backend environment variables:

```env
SECRET_KEY=change-this
DATABASE_URL=sqlite:///mediconnect.db
FLASK_ENV=development
```

### Frontend

```bash
cd frontend
npm install
```

## Run the Project

### Terminal 1 - Backend

```bash
cd backend
source venv/bin/activate
python3 run.py
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

- Backend: [http://localhost:5001](http://localhost:5001)
- Frontend: [http://localhost:5173](http://localhost:5173)

The backend creates the SQLite database automatically on startup if it does not exist.

## Seed Test Data

```bash
cd backend
source venv/bin/activate
python seed.py
```

Use the seeded data to quickly test patient and staff flows in the app.
