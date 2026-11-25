# ScholarFinder AI

**University Hackathon — Track 3: Personalized Learning & Productivity**

ScholarFinder AI is a complete, responsive, bilingual (**English & বাংলা**) scholarship discovery web application. It pairs a **deterministic JavaScript eligibility engine** (zero AI guesswork on rules) with a **modular free-tier AI coaching backend** (Google Gemini API with automatic JavaScript fallback).

---

## Key Features

- **Real CSV Dataset Ingestion**:
  - Automatic loading from `frontend/data/track3_scholarships.csv` (or `track3_scholarships (1).csv`), plus drag-and-drop / file picker CSV upload and Google Sheets CSV link fetching.
  - RFC-4180 compliant parser with flexible header auto-detection, missing-value handling, validation summary, and preservation of extra CSV columns.
  - **Zero fake data**: No dummy scholarship records are fabricated if no dataset is loaded.
- **Deterministic Eligibility Matching Engine (`frontend/js/matching.js`)**:
  - Separates scholarships into **Eligible**, **Almost Eligible**, and **Not Eligible**.
  - Evaluates minimum CGPA, department eligibility (including abbreviation/synonym matching and open-to-all flags), financial need compatibility, country/region, and semester/level rules.
  - **Almost Eligible Gap Calculator**: Displays exact shortfalls (e.g., `Required CGPA: 3.50 | Your CGPA: 3.40 | Missing CGPA: 0.10`).
  - Transparently flags unspecified dataset fields so students verify them on the official portal.
- **Modular Free-Tier AI Integration (`backend/services/aiService.js`)**:
  - Uses Google Gemini free-tier REST API (`gemini-2.5-flash`) by default, or any OpenAI-compatible free provider (Groq, OpenRouter, local Ollama) via `.env`.
  - API keys stay strictly on the Express backend — never exposed in frontend code.
  - **Automatic JS Fallback**: If the backend is offline, unconfigured, or hits a free-tier rate limit (`429`), bilingual JavaScript explanations, improvement advice, and guides remain 100% functional.
- **Complete Dashboard & Student Productivity Suite**:
  - 5 KPI cards (Total, Eligible, Almost Eligible, Saved, Upcoming Deadlines).
  - Search, Department filter, Category tabs, and Sorting (Best Match, Earliest Deadline, Highest Amount, Required CGPA).
  - Bookmarks, Application Progress Tracker (`Not Started` → `Awarded`), Interactive Document Checklist, In-app Deadline Reminders, Profile Editor, CSV Export, and Print Report (`@media print`).
  - Full **English & বাংলা** switcher across the entire UI and AI responses while preserving official scholarship names.

---

## Project Structure

```text
scholarfinder-ai/
├── frontend/
│   ├── index.html              # Landing page, CSV uploader & student profile form
│   ├── dashboard.html          # Matching dashboard, KPIs, filters, modals & tracker
│   ├── css/
│   │   └── style.css           # Responsive EdTech SaaS styles & print layout
│   ├── js/
│   │   ├── language.js         # EN / বাংলা translation dictionary & switcher
│   │   ├── storage.js          # LocalStorage persistence layer
│   │   ├── csvLoader.js        # RFC-4180 CSV parser, validator, Google Sheets & export
│   │   ├── matching.js         # Pure JavaScript eligibility & almost-eligible engine
│   │   ├── scholarship.js      # Backend AI client + deterministic bilingual fallback
│   │   ├── app.js              # Landing page controller
│   │   └── dashboard.js        # Dashboard controller
│   └── data/
│       └── README.txt          # Place track3_scholarships (1).csv here for auto-load
├── backend/
│   ├── server.js               # Express server, CORS, health, /api/sheets/fetch
│   ├── routes/
│   │   └── ai.js               # /api/ai/status, /api/ai/explain, /api/ai/recommend
│   ├── services/
│   │   ├── aiService.js        # Modular provider router & strict grounding prompts
│   │   └── providers/
│   │       ├── geminiProvider.js
│   │       └── openaiCompatProvider.js
│   ├── package.json
│   └── .env.example
├── tests/
│   ├── csvLoader.test.mjs      # Unit tests for CSV parsing, normalization & export
│   └── matching.test.mjs       # Unit tests for matching rules, CGPA gaps & fallback
└── README.md
```

---

## Dataset Setup (Google Sheets & `track3_scholarships (1).csv`)

Target Google Sheet link:
`https://docs.google.com/spreadsheets/d/1maevjSKmNVUyjKEmMQRBXs10oVJdM6-y_IGe2UL7pv8/edit?usp=sharing`

> **Note:** When accessed programmatically without authentication, this Google Sheet returns **HTTP 401 Unauthorized** (it is restricted/private).

### Option A: Upload `track3_scholarships (1).csv` in the Browser (Recommended)
1. Open `index.html` or `dashboard.html`.
2. Drag and drop `track3_scholarships (1).csv` into the CSV Upload dropzone (or click to select it).
3. Your dataset is validated, normalized, and saved in browser LocalStorage.

### Option B: Auto-Load from `frontend/data/`
1. Copy `track3_scholarships (1).csv` into `frontend/data/track3_scholarships.csv` (or `frontend/data/track3_scholarships (1).csv`).
2. Serve `frontend/` over HTTP (e.g., VS Code Live Server, `npx serve frontend`, or `SERVE_FRONTEND=true` on the backend).
3. The app automatically loads the CSV on startup.

### Option C: Export Any Private Google Sheet as CSV
1. Open the Google Sheet in your browser while signed in.
2. Go to **File → Download → Comma Separated Values (.csv)**.
3. Upload the downloaded `.csv` file inside ScholarFinder AI.

---

## Local Installation & Running

### Prerequisites
- **Node.js** v18+ (uses built-in `fetch` and `node --test`).

### 1. Configure & Run the Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` and add your free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
PORT=5000
CORS_ORIGIN=*
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```
Start the backend:
```bash
npm start
```
Verify health at `http://localhost:5000/api/health`.

> **Tip:** To run both frontend and backend from one Express server locally, set `SERVE_FRONTEND=true` in `backend/.env` and open `http://localhost:5000/index.html`.

### 2. Run the Frontend Separately (Static)
Open a second terminal in the project root:
```bash
npx serve frontend -l 5500
```
Then visit `http://localhost:5500`.

*(Avoid opening HTML via `file://` if you want automatic `./data/` CSV loading; `file://` still works with manual CSV file upload and `http://localhost:5000` backend calls.)*

---

## Running Automated Tests

From the `scholarfinder-ai/` root directory:
```bash
node --test tests/*.test.mjs
```

---

## Free-Tier Deployment Guide & Honest Usage Limits

### 1. Frontend Hosting: GitHub Pages (Free)
- Push the `frontend/` directory (or deploy `frontend/` via GitHub Actions `actions/deploy-pages`).
- **Limits**: Public repositories get free static hosting with a soft bandwidth limit (100 GB/month) and 1 GB site size limit. Static only (cannot store `.env` secrets or run Node.js).
- In `dashboard.html` → **Settings (⚙)**, paste your deployed backend URL (e.g. `https://scholarfinder-api.onrender.com`) so GitHub Pages communicates with your backend.

### 2. Backend Hosting: Render Free Web Service (or Railway / Koyeb)
- Deploy the `backend/` folder as a Node Web Service (`Build: npm install`, `Start: npm start`).
- Set environment variables (`GEMINI_API_KEY`, `AI_PROVIDER=gemini`, `CORS_ORIGIN=https://<your-username>.github.io`).
- **Honest Free-Tier Limits**:
  - **Render Free Tier**: Spins down after 15 minutes of inactivity (cold start takes ~30–50 seconds on the first request) and includes 750 free instance hours/month.
  - **Google Gemini API Free Tier**: Subject to requests-per-minute (RPM) and requests-per-day (RPD) quotas set by Google AI Studio, and prompts/responses may be subject to Google's free-tier data policy unless upgraded to a paid billing tier. If quota is exceeded (`429`), ScholarFinder AI automatically switches to its deterministic JavaScript fallback so the app never breaks.
  - **Alternative Free AI**: Set `AI_PROVIDER=openai-compat` in `.env` with Groq's free tier (`https://api.groq.com/openai/v1`) or run a local model with Ollama (`http://localhost:11434/v1`) for zero cloud rate limits.
