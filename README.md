# Quiz Master V1

A multi-user exam-preparation platform built for the *Modern Application Development I* course at IIT Madras. Supports one admin (quiz master) who manages subjects, chapters, and quizzes, and any number of registered users who attempt quizzes and track their scores.

## Tech Stack
- **Backend:** Flask, Flask-Login (session-based authentication)
- **Frontend:** Jinja2, HTML, CSS, Bootstrap
- **Database:** SQLite (schema created programmatically, no manual DB tooling)
- **Charts:** Chart.js, for admin and user summary dashboards
- **API:** JSON endpoints for subject/chapter/quiz resources

## Roles
- **Admin** — pre-seeded, single superuser; creates/edits/deletes subjects, chapters, and quizzes (with single-correct-option MCQ questions), and manages users.
- **User** — registers, logs in, selects a subject and chapter, attempts timed quizzes, and views score history.

## Data Model
`User`, `Subject`, `Chapter`, `Quiz`, `Question`, `Score` — related via foreign keys (Quiz → Chapter, Question → Quiz, Score → Quiz + User).

## Features
- Authentication via Flask-Login for both admin and user roles
- Admin dashboard: subject/chapter/quiz CRUD, user and quiz search, summary charts
- Quiz management: MCQ question creation, quiz duration and scheduling
- User dashboard: timed quiz attempts, score history, summary charts
- JSON API endpoints for subject/chapter/quiz resources
- Frontend and backend form validation

## Running Locally
\`\`\`bash
git clone <repo-url>
cd quiz-master-v1
pip install -r requirements.txt
python app.py
\`\`\`

## Course Context
Built to spec for IIT Madras's Modern Application Development I project (Quiz Master V1) — mandatory frameworks (Flask, Jinja2, SQLite) plus the course's recommended API and validation requirements.
