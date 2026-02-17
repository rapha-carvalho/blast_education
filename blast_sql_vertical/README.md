# Blast SQL Learning Platform

A POC educational platform for teaching SQL interactively. Hosted on NAS with Cloudflare Tunnel at `school.blastgroup.org`.

## Architecture

- **Frontend**: React + Vite, Monaco SQL editor, served by Nginx
- **Backend**: FastAPI, in-memory DuckDB per session
- **Content**: JSON/YAML lesson files (no CMS)

## Quick Start

### Local development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://localhost:8000`.

### Docker

```bash
docker-compose up -d
```

- Frontend: http://localhost (port 80)
- Backend: internal only (port 8000)
- API: http://localhost/api/* proxied to backend

## Project structure

```
blast_sql_vertical/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── services/
│   └── content/
│       ├── courses.json
│       ├── seed.sql
│       └── sql_basics/module_1/*.json
└── frontend/
    └── src/
```

## Content

- **SQL Basics** course, Module 1 (SELECT Fundamentals)
- 5 lessons: Introduction to SELECT, WHERE, ORDER BY, LIMIT, Aggregations
- Demo tables: `customers`, `orders`, `products`

## Security

- Only `SELECT` allowed; destructive statements blocked
- Per-session DuckDB sandbox
- Query length limit (10KB)
- Backend not exposed to internet

## Cloudflare Tunnel

See [cloudflare/DEPLOY.md](cloudflare/DEPLOY.md) for deployment behind Cloudflare Tunnel.
