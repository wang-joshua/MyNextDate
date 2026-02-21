# MyNextDate 💕

Never stress about planning a date again. MyNextDate recommends personalized date activities based on your dating history using vector similarity search.

## What It Does

Press a button and get two date recommendations tailored to your preferences. The more dates you log and rate, the smarter the recommendations get.

## Features

- **Smart Recommendations** — Vector similarity search finds the best date activities based on your past ratings
- **Date History Dashboard** — Log, rate, and manage all your past dates in one place
- **Analytics** — See your success rate, trends, and what kind of dates work best for you
- **Secret Breakup Button** — Finds the worst possible date (you know, just in case)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Python + FastAPI |
| Auth + Storage | Supabase (Auth + Postgres) |
| Vector Database | Actian Vector AI DB |

## Project Structure

```
mynextdate/
├── mynextdate-frontend/     # React app
│   └── src/
├── mynextdate-backend/      # FastAPI app
│   ├── routes/
│   │   ├── recommend.py     # Recommendation endpoint
│   │   └── dates.py         # Date history endpoints
│   ├── services/
│   │   ├── preference_engine.py   # Preference vector computation
│   │   ├── actian_service.py      # Vector DB queries
│   │   └── analytics.py           # Analytics logic
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## How It Works

1. You log past dates and rate them 0–5 hearts
2. The app builds a preference vector from your highest-rated dates across 9 dimensions: cost, indoor/outdoor, effort, social density, time of day, duration, planning required, energy level, and creativity
3. That vector is compared against 200 date activities in the Actian vector database using cosine similarity
4. The top 2 matches are returned as your recommendations

## Getting Started

### Prerequisites
- Node.js (LTS)
- Python 3.10+
- Supabase account
- Actian Vector AI DB access

### Frontend
```bash
cd mynextdate-frontend
npm install
npm start
```

### Backend
```bash
cd mynextdate-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```
SUPABASE_URL=
SUPABASE_KEY=
ACTIAN_CONNECTION_STRING=
```

## Team
Built at Hackalytics 2026 by Joshua Wang, Shreyansh Bhalani, Jay Daftari, and Akshat Mishra.
