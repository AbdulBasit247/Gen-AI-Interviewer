# Gen-AI-Interviewer

AI-powered interview preparation platform. Paste a job description, add your resume or a quick self-description, and get a personalized interview prep report — match score, likely technical & behavioral questions with model answers, skill gaps, and a day-by-day preparation roadmap. You can also generate a resume tailored to the job you're targeting.

Built with the **MERN stack** (MongoDB, Express, React, Node.js) and **Google Gemini** for report/resume generation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Key Design Decisions](#key-design-decisions)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Features

- 🔐 **Authentication** — JWT stored in an httpOnly cookie, with server-side token blacklisting on logout
- 📄 **Resume or self-description input** — upload a PDF resume or type a quick summary of your background
- 🤖 **AI-generated interview report** — match score, technical questions, behavioral questions (with the interviewer's intention and a model answer for each), skill gaps by severity, and a preparation roadmap
- 🧾 **Tailored resume generation** — download a job-tailored resume as a PDF
- 🗂️ **Report history** — every generated report is saved and can be revisited or deleted later
- 🎨 **Clean, dark-themed UI** — feature-folder React app with per-page loading states and empty/error states

## Tech Stack

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) for auth, `bcryptjs` for password hashing
- `@google/genai` (Gemini) for report and resume content generation
- `zod` + `zod-to-json-schema` for validating the AI's structured output
- `puppeteer` for rendering the generated resume HTML to PDF
- `multer` for resume file uploads, `pdf-parse` for extracting resume text

**Frontend**
- React 19 + Vite
- `react-router` v7 for routing
- Axios for API calls
- `sonner` for toast notifications
- SCSS (hand-written, no CSS framework)

## Architecture

```
┌────────────┐        axios (withCredentials)        ┌────────────┐
│  Frontend  │ ─────────────────────────────────────▶ │  Backend   │
│ React+Vite │ ◀───────────────────────────────────── │  Express   │
└────────────┘          JSON / PDF blob                └─────┬──────┘
                                                               │
                                              ┌────────────────┼────────────────┐
                                              ▼                ▼                ▼
                                        ┌───────────┐   ┌─────────────┐  ┌─────────────┐
                                        │ MongoDB   │   │ Google      │  │ Puppeteer   │
                                        │ (Mongoose)│   │ Gemini API  │  │ (PDF render)│
                                        └───────────┘   └─────────────┘  └─────────────┘
```

Auth uses a JWT stored in an **httpOnly cookie** (not localStorage), so every frontend request is sent with `withCredentials: true`. On logout, the token is stored in a `blacklistTokens` collection with a TTL index so it can't be reused even before its natural expiry — the collection self-cleans after 6 hours.

## Project Structure

```
Gen-AI-Interviewer/
├── Backend/
│   ├── server.js                     # Entry point — loads env, connects DB, starts server
│   └── src/
│       ├── app.js                    # Express app: middleware + route mounting
│       ├── config/database.js        # MongoDB connection
│       ├── models/                   # Mongoose schemas (user, blacklist, interviewReport)
│       ├── middlewares/              # JWT auth guard, file upload handling
│       ├── routes/                   # auth.routes.js, interview.routes.js
│       ├── controllers/              # Request handling logic
│       └── services/ai.service.js    # Gemini prompts + Puppeteer PDF generation
└── Frontend/
    └── src/
        ├── main.jsx, App.jsx         # App bootstrap, providers, toast host
        ├── app.routes.jsx            # Route table
        ├── pages/NotFound.jsx        # 404 catch-all
        └── features/
            ├── auth/                 # Context, hook, API service, pages, shared components
            └── interview/            # Context, hook, API service, pages, styles
```

Each feature follows the same pattern: **Context** (state only) → **Hook** (logic + API calls, reads/writes context) → **Page** (UI, consumes the hook).

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, GOOGLE_GENAI_API_KEY (see below)
npm run dev
```

The API runs on `http://localhost:3000` by default.

### Frontend Setup

```bash
cd Frontend
npm install
cp .env.example .env
# set VITE_API_BASE_URL to your backend URL
npm run dev
```

The app runs on `http://localhost:5173` by default (Vite's default port).

> Puppeteer downloads a Chromium binary on `npm install` for the Backend — make sure you have enough disk space and, on Linux, the required system libraries for headless Chrome.

## Environment Variables

**`Backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (defaults to `3000`) |
| `Client_URL` | Frontend origin, used for CORS (e.g. `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` — affects cookie `secure` flag |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign/verify auth tokens |
| `GOOGLE_GENAI_API_KEY` | API key for Google Gemini |

**`Frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API |
| `VITE_APP_ENV` | Optional environment label for the frontend build |

## API Reference

Base path for all endpoints below: as configured in `VITE_API_BASE_URL`.

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create an account, sets the auth cookie |
| POST | `/login` | Public | Authenticate, sets the auth cookie |
| POST | `/logout` | Private | Blacklists the current token, clears the cookie |
| GET | `/get-me` | Private | Returns the logged-in user's profile |

### Interview — `/api/interview`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Generate a new interview report (`multipart/form-data`: `jobDescription`, `selfDescription`, `resume`) |
| GET | `/` | Private | List the current user's reports (summary fields only) |
| GET | `/report/:interviewId` | Private | Fetch one full report (ownership-checked) |
| POST | `/resume/pdf/:interviewReportId` | Private | Generate and stream a tailored resume PDF |
| DELETE | `/:interviewId` | Private | Delete a report (ownership-checked) |

All `Private` routes require the auth cookie and go through the `authUser` middleware.

## Key Design Decisions

- **JWT in an httpOnly cookie**, not localStorage — reduces XSS exposure. Requires `credentials`/`withCredentials` on both CORS and every frontend request.
- **Token blacklist with a TTL index** — since JWTs are stateless, logout alone can't invalidate a token; the blacklist collection is the workaround, and the TTL index keeps it from growing forever.
- **AI output is schema-validated twice** — once as a hint sent *to* Gemini (`responseSchema`), and again on the way back with `zod.safeParse()`, since the schema hint isn't a hard guarantee.
- **Untrusted input is fenced in prompts** — resume/job-description text is wrapped in `<candidate_data>` tags with an explicit instruction not to follow anything inside them, as basic mitigation against prompt injection via a resume or job posting.
- **A shared Puppeteer browser instance** is reused across PDF generation requests instead of launching a new Chromium process per request, cutting per-request latency.
- **Split, per-action loading states** in the frontend (rather than one global `loading` per context) so one action (e.g. downloading a resume) doesn't block/blank an unrelated part of the UI.

## Known Limitations

- No automated test suite (backend or frontend) — verification is currently manual.
- Delete/logout confirmations use the browser's native `window.confirm`; a custom modal would look more polished.
- No rate limiting on report generation — each call hits the Gemini API and, for resumes, Puppeteer.
- No pagination on the reports list.

## License

No license file is currently included — add one (e.g. MIT) if you intend to open-source this project.
