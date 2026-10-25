# SharePlate AI
### Smart Food Waste Redistribution Platform

SharePlate AI is a web application designed to help redistribute surplus food from donors to recipient organizations. It uses an AI-based matching engine to recommend suitable recipients based on food and recipient details.

## Features

- Food donation management
- Recipient organization management
- AI-based donation matching
- Pickup tracking and OTP verification
- Food redistribution impact reports
- Authentication and role-based access control
- Input validation and audit logging

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **AI Engine:** Python
- **Database:** SQLite, with PostgreSQL and MySQL schema options

## Project Structure

```text
SharePlate_AI/
├── backend/
├── frontend/
├── ai_engine/
├── database/
├── screenshots/
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Install Node.js with npm and Python. Git is required to clone the repository.

## Setup and Run

### 1. Backend

```bash
cd backend
npm install
npm start
```

### 2. AI Engine

Open a separate terminal:

```bash
cd ai_engine
python -m pip install -r requirements.txt
python service.py
```

### 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The backend normally runs on port `5000`, and the AI service on port `5001`. Keep all three terminals running while using the application.

## Database

The backend uses the database configuration provided by the project. Check the backend configuration and environment variables before running it in a fresh environment. Do not commit secrets or local database credentials.

## Testing

Backend tests are located in `backend/tests/`, and AI matching tests are located in `ai_engine/tests/`. Use the test commands supported by each package's configuration.

## Security

- Keep environment secrets in local `.env` files.
- Use `.env.example` as a configuration template.
- Do not commit passwords, tokens, or private credentials.

## Project Status

This project is intended for local development and demonstration. Cloud deployment must be configured separately.

## License

No license has been specified yet.
