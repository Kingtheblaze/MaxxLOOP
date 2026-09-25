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
