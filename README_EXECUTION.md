# MaxxLoop Execution & Demo Guide (ASYNC 2026)

This guide provides the fastest path to boot, run, test, and demo **MaxxLoop** for hackathon judges and evaluators.

---

## ⚡ 3-Command Quick Start

```bash
# 1. Clone & Enter project
cd maxxloop

# 2. Setup dependencies (Python 3.11+ and Node 18+)
make setup

# 3. Launch Development Servers
make dev
```
- **Backend API**: `http://localhost:8000` (OpenAPI Swagger docs at `http://localhost:8000/docs`)
- **Frontend PWA**: `http://localhost:3000`

---

## 🐳 Option B: Docker Compose (Zero Setup)

If you have Docker installed:
```bash
docker compose up --build
```
Both the API and Web services will start up automatically with volume mounts.

---

## ☁️ Deploy the Web App to Vercel

The Next.js app is deployed to Vercel from `apps/web`, where `vercel.json` explicitly selects Next.js and the npm install/build commands. Set Vercel's **Root Directory** to `apps/web` so it reads that configuration. The FastAPI service must be deployed separately to a Python host that supports persistent storage; this project uses SQLite for app data and MongoDB for accounts and sessions, so Vercel serverless functions are not a drop-in host for the API.

1. Deploy `apps/api` first as a Docker web service on a Python host that supports persistent disks. Set its root directory to `apps/api`, use its `Dockerfile`, and mount a persistent disk at `/data`. Configure `DATABASE_URL=sqlite:////data/maxxloop.db`, `MONGODB_URI` with your MongoDB Atlas connection string, `MONGODB_DATABASE=maxxloop`, and `APP_ENV=production`. For Gemini explanations, set `LLM_PROVIDER=gemini` and add `GEMINI_API_KEY` as a secret on that API host. The container uses the host's `PORT` automatically. Do not use `mongodb://localhost:27017/` for a remotely hosted API.
2. In Vercel, import the repository and set **Root Directory** to `apps/web`. Keep the framework as Next.js and the build command as `npm run build`.
3. Add the Vercel environment variable `API_INTERNAL_URL` in both **Production** and **Preview**, with the public HTTPS origin of the deployed API, for example `https://maxxloop-api.example.com` (no trailing slash). Vercel builds fail if it is missing or is not an HTTPS origin. Redeploy after adding it.
4. Confirm the API responds at `https://<api-host>/health`, then open the Vercel deployment and test sign-up, sign-in, and the demo flow.

The web app sends requests to same-origin `/api/...` routes; Next.js rewrites those requests to `API_INTERNAL_URL`. This keeps session cookies first-party in the browser. Do not set `NEXT_PUBLIC_API_URL`, `GEMINI_API_KEY`, or `MONGODB_URI` in the Vercel web project; provider and database secrets belong only on the API host.

### Vercel CLI (PowerShell)

Run these commands from the repository root after installing the Vercel CLI and linking the project:

```powershell
cd "D:\Riot Games\Anime Quiz\PROJECTT\MaxxLOOP\apps\web"
vercel link
vercel env add API_INTERNAL_URL production
vercel env add API_INTERNAL_URL preview
vercel --prod
```

Enter the API's HTTPS origin when `vercel env add` prompts for the value. In the Vercel project settings, also set the **Root Directory** to `apps/web` if you linked the project from the repository root instead.

---

## 🛠️ Step-by-Step Manual Launch (Windows / Mac / Linux)

### 1. Terminal 1 — Backend (FastAPI)
```bash
cd apps/api
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Health verification*: Open `http://localhost:8000/health` in your browser.

### 2. Terminal 2 — Frontend (Next.js PWA)
```bash
cd apps/web
npm install
npm run dev
```
*Web verification*: Open `http://localhost:3000` in your browser (press `F12` and toggle 390px mobile view for the optimal PWA frame).

---

## ⏱️ How to Run the 90-Second Judge Demo

The **Demo Console** enables a complete, reliable end-to-end demonstration of the closed loop in under 90 seconds without waiting for 25-minute study timers.

1. **Open Demo Console**:
   Navigate to `http://localhost:3000/demo` (or click **"Demo"** in the bottom navigation bar).
2. **Step 1 — Seed Persona**:
   Click **"Aarav Sharma (Exam Week)"**.  
   *What happens:* Generates 14 days of realistic signals (sleep debt, 24 tabs/hr) stored in SQLite.
3. **Step 2 — Trigger Immediate Capacity Drop**:
   Click **"Trigger Immediate Capacity Drop"**.  
   *What happens:* Injects an acute drop state. The mathematical engine detects a plunge to 32 points (-18 below baseline), isolates tab switching and sleep deficit, and selects ONE action via Thompson Sampling.
4. **Step 3 — View Hero Loop (Now Screen)**:
   Click **"Open Hero Loop Screen (Now)"** or navigate to `http://localhost:3000/`.  
   - Notice the **Loop Ring** highlights **"Understand"**.
   - Review the root driver chips and the plain-language explanation.
   - Click **"Why this recommendation?"** to inspect the real clipped z-scores and Beta posteriors.
   - Click **"Start 3m Action"**.
5. **Step 4 — Time-Warp the Measurement Window**:
   Click **"Warp"** in the top yellow DemoBar (or in the Demo Console).  
   *What happens:* Fast-forwards the 25-minute timer so you can immediately test the **Measure** stage.
6. **Step 5 — Measure & Close the Loop**:
   - The screen advances to **"Measure"**.
   - Move the sliders to submit a post-window check-in (e.g. Focus: 4, Energy: 4, Stress: 2).
   - Click **"Measure & Record Outcome"**.
   - Review the **Result**: Observed Delta (+11.4), Expected Drift without action (+2.1), and Net Treatment Effect (+9.3 pts).
   - Click **"Yes, helpful"** to complete Bayesian posterior updating.
7. **Step 6 — Review Personal Insights**:
   Navigate to `http://localhost:3000/insights` to observe the updated ranking and 95% Credible Intervals.

---

## 🧪 Running Automated Tests

MaxxLoop features a comprehensive backend test suite covering the mathematical engine, recommender, counterfactual measurement, crisis safety, and end-to-end loop flow:

```bash
cd apps/api
pytest -v
```

### Specific Test Modules:
- **Engine Core (MAD, Z-Scores, Attribution)**:
  ```bash
  pytest tests/test_engine.py
  ```
- **Thompson Sampling Recommender**:
  ```bash
  pytest tests/test_recommender.py
  ```
- **Counterfactual Measurement & Posteriors**:
  ```bash
  pytest tests/test_measurement.py
  ```
- **Crisis Interception & Safety**:
  ```bash
  pytest tests/test_safety.py
  ```
- **Complete End-to-End Loop**:
  ```bash
  pytest tests/test_e2e_loop.py
  ```

---

## 📈 Running the 200-User Synthetic Simulation

To run the 200-agent mathematical evaluation:
```bash
python scripts/simulate_users.py
```
This simulates 6,000 closed loops, validates Bayesian convergence toward high-leverage actions, and updates `docs/EVALUATION.md`.

---

## 🔧 Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| `Unable to connect to MaxxLoop Engine` | Backend is not running on port 8000 | Ensure `uvicorn app.main:app --port 8000` is active in Terminal 1. |
| Database lock / corrupted DB | SQLite process collision | Run `make clean` or delete `apps/api/maxxloop.db` and reseed. |
| CORS error in console | Next.js running on non-standard port | FastAPI CORS is set to allow `http://localhost:3000` and `*`. |
| Port 8000 already in use | Stale process | Free port 8000 or change `PORT=8001` in `.env` and `apps/web/next.config.js`. |
