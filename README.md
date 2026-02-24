# MediConnect

A hospital-style patient portal with ticketing, AI-assisted appointment scheduling, and lab results.

## What You Need

### Prerequisites
- **Node.js** 18+ (for React frontend)
- **Python** 3.10+ (for Flask backend)
- **OpenAI API key** or **Google Gemini API key** (for AI scheduling)

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

### Environment Setup

Create `backend/.env`:
```
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///mediconnect.db
OPENAI_API_KEY=sk-your-openai-key
# Or for Gemini:
# GEMINI_API_KEY=your-gemini-key
```

### Run the Application

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

Creates: `patient@test.com` / `staff@test.com` (password: `password123`)

## Features

- **Patient Portal**: Tickets, appointments, lab results
- **Staff Portal**: Manage tickets, schedule, upload lab results
- **AI Scheduling**: Natural language ("next week after 2pm") → slot recommendations
- **Admin Analytics**: Ticket metrics, CSV export
