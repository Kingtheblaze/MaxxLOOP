# MaxxLoop Demo Script (ASYNC 2026 Hackathon)

This document provides exact, click-by-click walkthroughs for demonstrating MaxxLoop to hackathon judges.

---

## ⚡ The 90-Second Fast Track Demo

| Timestamp | Screen / Action | Spoken Line |
|---|---|---|
| **0:00 - 0:15** | Open `http://localhost:3000/demo`<br>Click **"Aarav Sharma (Exam Week)"** | *"Most wellness apps fail students because they are passive dashboards that nag with generic advice. MaxxLoop is different: it’s a closed-loop AI companion that detects capacity drops, recommends ONE micro-action, and measures whether it actually worked."* |
| **0:15 - 0:30** | Click **"Trigger Immediate Capacity Drop"**<br>Click **"Open Hero Loop Screen (Now)"** | *"Here, Aarav is deep into midterm prep. MaxxLoop's engine detects his capacity has dropped 18 points below his normal baseline. Notice the Loop Ring immediately advances to 'Understand'."* |
| **0:30 - 0:45** | Highlight **Driver Chips**<br>Click **"Why this recommendation?" drawer** | *"Instead of a vague alert, MaxxLoop attributes the drop to exact root drivers: tab switching 3x higher than normal and 1.5 hours of sleep debt. In the math drawer, judges can see real clipped z-scores and Thompson Sampling Beta posteriors."* |
| **0:45 - 1:00** | Click **"Start 3m Action"**<br>Observe the focus timer ring | *"Notice the non-negotiable rule: exactly ONE action. Here it recommends a 3-minute 4x4 Box Breathing reset. We hit Start, and the focus timer begins."* |
| **1:00 - 1:15** | Click **"Warp"** in top DemoBar<br>Screen updates to **"Measure"** | *"In a real study sprint, the window lasts 25 minutes. In our Demo Console, we can time-warp to the post-window re-check-in."* |
| **1:15 - 1:30** | Select Post Focus: 4, Energy: 4, Stress: 2<br>Click **"Measure & Record Outcome"**<br>Point to **Net Effect: +8.2 pts** | *"Here is our honest measurement: observed delta was +10.5 points, but after subtracting expected counterfactual drift without action, the net treatment effect is +8.2 points. The Beta posterior updates immediately, and the loop is closed."* |

---

## 🎙️ The 3-Minute Comprehensive Deep-Dive

### Act I: The Broken Paradigm (0:00 - 0:45)
- Open the **Now** screen with a seeded 14-day history.
- **Narrative**: *"Knowledge workers and students don't need another dashboard telling them they're stressed. They know they're stressed. What they need is an intelligent closed loop: What happened? What single action should I take right now? And did it actually work?"*
- Walk through the **Loop Ring**: Track → Understand → Act → Measure → Improve.

### Act II: Live Loop Execution (0:45 - 2:00)
- Trigger a drop via the Demo Console.
- Demonstrate that **zero API keys** are needed—TemplateProvider produces crisp, supportive human language using only calculated drivers.
- Open **"Why this?" drawer** to prove explainability: show how Thompson Sampling balances exploitation (proven breathing exercises) with 15% exploration.
- Start action, time-warp, and complete the 2-tap post check-in.
- Explain the **Counterfactual Net Effect**: *"We never claim pure causation. We measure observed score against control windows from past skipped interventions."*

### Act III: Insights & Privacy Guarantee (2:00 - 3:00)
- Navigate to **Insights**:
  - Show the **"What Works For You"** table ranked by net effect with 95% Credible Intervals.
  - Highlight the pitch metrics: **88% helpfulness** and **+7.4 avg net recovery**.
- Navigate to **Privacy**:
  - Open the **Live LLM Payload Inspector**: show judges the exact sanitized JSON.
  - Point out that raw calendar event titles, browser URLs, and free-text notes never leave the device and are never transmitted to any third party.
- Conclude: *"MaxxLoop is local-first, mathematically explainable, and built to turn passive monitoring into active, measurable recovery."*
