# MaxxLoop REST API Documentation

The MaxxLoop backend exposes an OpenAPI-compliant REST API. An interactive Swagger UI is available at `http://localhost:8000/docs`.

---

## Base URL
```
http://localhost:8000
```

---

## Endpoints

### 1. Health Check
`GET /health`
- **Description:** Verifies service uptime, active LLM provider, and demo settings.
- **Response:**
```json
{
  "status": "healthy",
  "service": "maxxloop-api",
  "version": "1.0.0",
  "llm_provider": "template",
  "demo_mode": true
}
```

---

### 2. Telemetry Ingestion
`POST /signals`
- **Description:** Ingests an individual sensor or manual signal.
- **Request Body:**
```json
{
  "kind": "context_switches_per_hour",
  "value": 28.0,
  "source": "browser"
}
```
- **Response:**
```json
{
  "status": "success",
  "signal_id": 142
}
```

`POST /signals/batch`
- **Description:** Ingests an array of signals in a single transaction.

---

### 3. Check-ins & State Evaluation
`POST /checkins`
- **Description:** 10-second self-report check-in. Evaluates capacity, scans for crisis language, and triggers loop if a drop is detected.
- **Request Body:**
```json
{
  "focus_self": 2.0,
  "energy_self": 2.0,
  "stress_self": 4.5,
  "note": "Exhausted after long lecture"
}
```
- **Response:**
```json
{
  "status": "success",
  "snapshot_id": 48,
  "score": 34.2,
  "baseline": 50.0,
  "delta": -15.8,
  "is_drop": true,
  "drivers": [
    {
      "kind": "stress_self",
      "contribution": -0.42,
      "label": "Self-reported stress level is elevated (4.5/5)",
      "z_score": -2.1
    }
  ],
  "active_intervention": {
    "intervention_id": 12,
    "action": {
      "id": "box_breathing_4x4",
      "title": "4x4 Box Breathing",
      "duration_min": 3
    }
  }
}
```

---

### 4. Real-time Capacity
`GET /capacity/now`
- **Description:** Returns current score, baseline, delta, status label, top drivers, and 14-day sparkline.

---

### 5. Hero Closed-Loop Lifecycle
`GET /loop/active`
- **Description:** Returns current state of the active loop (`track`, `understand`, `act`, `measure`, `improve`).

`POST /loop/{id}/start`
- **Description:** Marks intervention as started, initiating the countdown window.

`POST /loop/{id}/skip`
- **Description:** Skips intervention. Automatically registers the drop as a counterfactual control window.

`POST /loop/{id}/measure`
- **Description:** Receives post-window check-in, computes net treatment effect, updates Beta posterior.
- **Request Body:**
```json
{
  "focus_self": 4.0,
  "energy_self": 3.5,
  "stress_self": 2.0
}
```
- **Response:**
```json
{
  "status": "measured",
  "outcome_id": 9,
  "pre_score": 34.2,
  "post_score": 45.6,
  "observed_delta": 11.4,
  "expected_delta_no_action": 2.1,
  "net_effect": 9.3,
  "confidence": "Medium"
}
```

`POST /loop/{id}/feedback`
- **Description:** Records user helpfulness rating (`helpful`: boolean).

---

### 6. Personal Insights
`GET /insights`
- **Description:** Aggregates percentage helpful, average net recovery, ranked action efficacy table with 95% CIs, and drop time-of-day distributions.

---

### 7. Privacy & Data Portability
`GET /privacy/llm-payload`
- **Description:** Shows exact sanitized JSON payload sent to LLM and response received.

`GET /privacy/export`
- **Description:** Exports all database rows for user as a structured JSON file.

`DELETE /privacy/data`
- **Description:** Irrevocably purges all user signals, snapshots, interventions, and outcomes.

---

### 8. Demo Console
`POST /demo/seed` (`{"persona": "aarav" | "meera"}`)
`POST /demo/trigger-drop`
`POST /demo/timewarp`
`GET /demo/status`
