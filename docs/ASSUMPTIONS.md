# Engineering & Product Assumptions

Recorded in accordance with the MaxxLoop hackathon working rules: *Make the most reasonable assumption and record it instead of asking questions.*

---

## 1. Technological Stack Assumptions

1. **Local-First SQLite as Default**: Assumed that local SQLite with SQLModel/SQLAlchemy is the superior default over requiring external Postgres or cloud databases. This ensures zero setup friction for judges and full data privacy.
2. **Next.js 14 App Router + Tailwind CSS**: Assumed modern App Router architecture with client-side data fetching to ensure fast response times and offline-ready PWA capability.
3. **TemplateProvider as Primary Default**: Assumed that relying on external LLM APIs (Gemini/OpenAI) during a hackathon judging demo introduces latency, network fragility, and key expiration risks. Therefore, `TemplateProvider` is the default out of the box, with Gemini/Ollama/OpenAI pluggable via `.env`.
4. **Port Allocation**: Assumed FastAPI runs on port `8000` and Next.js runs on port `3000`. Cross-origin resource sharing (CORS) is configured explicitly for this pairing.

---

## 2. Statistical & Engine Assumptions

1. **14-Day Baseline Window**: Assumed 14 days provides the optimal balance between sample sufficiency ($N$) and adaptability to changing academic workloads (e.g. exam periods vs semester breaks).
2. **Time-of-Day Bucketing**: Assumed 4 discrete buckets (`morning` [06:00-12:00], `afternoon` [12:00-18:00], `evening` [18:00-24:00], `night` [00:00-06:00]) with a minimum threshold of $N \ge 5$ required to activate bucket-specific MAD baselines.
3. **Clipped Z-Score Range**: Assumed clipping z-scores to $[-3.0, 3.0]$ prevents acute outlier telemetry from distorting the $0-100$ capacity gauge.
4. **Counterfactual Drift Assumption**: Assumed that skipped interventions provide a statistically honest control group for the user's natural recovery or fatigue drift over the subsequent 25 minutes. When fewer than 3 control windows exist, a default prior of $+1.5$ points drift is blended.
5. **Thompson Sampling Exploration Rate**: Assumed a 15% exploration probability ensures continuous exploration of alternative interventions without degrading user trust.

---

## 3. Safety & Regulatory Assumptions

1. **India Regional Context for Helplines**: Assumed ASYNC 2026 participants and judges evaluate within the India context; hence, **Tele-MANAS** (`14416` / `1800-891-4416`) is the primary emergency mental health helpline.
2. **Zero Storage of Crisis Text**: Assumed that if crisis keywords are intercepted in self-report notes, storing that text in a local database constitutes an unnecessary privacy and safety risk. The text is discarded immediately in memory.
3. **Low-Risk Action Library**: Assumed that actions must be strictly restricted to behavioral, postural, environmental, and respiratory micro-habits. Any recommendation concerning diet, fasting, or supplements was intentionally excluded.
