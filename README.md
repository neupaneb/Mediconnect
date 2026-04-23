# MediConnect

MediConnect is my senior project for CSCI 411/412. It is a healthcare-style patient portal where patients can book appointments, submit support requests, and view lab results, while staff can manage appointments, upload labs, and review analytics.

I built this project to simulate a more realistic full-stack healthcare system instead of a small demo app. The goal was to practice role-based authentication, API design, frontend/backend integration, deployment, and AI-assisted workflows in one project.

## Project Features

### Patient Features

- Register and sign in
- Book appointments
- Use AI-assisted appointment scheduling
- Submit support requests
- Use AI to help draft support requests
- View lab results
- View a patient dashboard with recent activity

### Staff Features

- Sign in as staff
- Review and manage support requests
- Add available appointment times
- View scheduled appointments
- Upload lab results for patients
- View analytics and export data

### Technical Features

- JWT-based authentication
- Role-based access control
- Protected frontend routes
- Flask REST API backend
- React + Vite frontend
- Google Gemini API integration with fallback support
- Production deployment with Render and Vercel

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Context API
- CSS

### Backend

- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Flask-Bcrypt
- Python

### AI / External Services

- Google Gemini API
- OpenAI API fallback

### Deployment

- Vercel for the frontend
- Render for the backend

## Why I Built This

A lot of healthcare systems still depend on phone calls, basic portals, or disconnected workflows for scheduling and communication. I wanted to build something that felt closer to a real patient portal, where both patients and staff have useful tools in one place. I also wanted to explore how AI could improve the experience by helping users describe requests naturally instead of filling out everything manually.

## Folder Structure

```text
mediconnect/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── run.py
│   └── wsgi.py
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Prerequisites

Make sure you have these installed:

- Node.js 18+
- Python 3.10+
- `npm`
- `pip`

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/neupaneb/Mediconnect.git
cd Mediconnect
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `backend/.env` with your values if needed.

Example:

```env
SECRET_KEY=change-this
DATABASE_URL=sqlite:///mediconnect.db
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

The frontend environment file can be based on:

```env
VITE_API_BASE=http://localhost:5001/api
```

## Running the Project

Open two terminals.

### Terminal 1: Backend

```bash
cd backend
source venv/bin/activate
python3 run.py
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Then open:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5001](http://localhost:5001)

## Seed Data

If you want sample data for testing:

```bash
cd backend
source venv/bin/activate
python3 seed.py
```

This helps create sample users, appointments, and other records for testing both patient and staff flows.

## Example Usage

### Patient

1. Register as a patient
2. Sign in
3. Open `Appointments` to book an appointment
4. Open `My Requests` to create a support request
5. Open `Lab Results` to review uploaded test results

### Staff

1. Register as a staff user
2. Sign in to the staff dashboard
3. Add available appointment times
4. Review incoming support requests
5. Upload lab results for patients
6. Check analytics and exports

## AI Features

MediConnect includes AI-assisted workflows powered mainly by the Google Gemini API to make the portal easier to use:

- Patients can describe appointment preferences in natural language
- Patients can describe support requests in plain language and get drafted ticket fields
- The backend tries Gemini first and can fall back to OpenAI or local rules depending on configuration

## Deployment

The project is deployed online:

- Frontend: [https://mediconnect-mu-lac.vercel.app](https://mediconnect-mu-lac.vercel.app)
- Backend: [https://mediconnect-backend-fir2.onrender.com](https://mediconnect-backend-fir2.onrender.com)

## Current Limitations

- The deployed backend is currently using a temporary SQLite setup for testing
- Appointment suggestions depend on staff availability being configured
- Some production improvements, such as a Postgres database and custom domain, can still be added

## What I Learned

This project helped me understand how much work goes into building a complete full-stack application. I got hands-on experience with authentication, database models, REST APIs, deployment, debugging production issues, and improving user experience through iteration. I also learned that AI features are most useful when they support the workflow instead of replacing the core product logic.

## Author

Bibek Neupane  
Senior Project - CSCI 411/412
