#!/usr/bin/env python3
"""
MaxxLoop Demo Persona Seeder
Seeds realistic 14-day history for ASYNC 2026 Hackathon Demo.
Usage:
    python scripts/seed_demo.py --persona aarav
    python scripts/seed_demo.py --persona meera
"""

import sys
import os
import argparse

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.core.database import get_session, init_db
from app.routers.demo import seed_demo_persona
from app.models.schemas import DemoSeedRequest

def main():
    parser = argparse.ArgumentParser(description="Seed MaxxLoop demo personas")
    parser.add_argument("--persona", choices=["aarav", "meera"], default="aarav", help="Persona to seed")
    args = parser.parse_args()

    init_db()
    session = next(get_session())

    print(f"[*] Seeding demo persona: {args.persona.upper()}...")
    result = seed_demo_persona(DemoSeedRequest(persona=args.persona), session=session)
    print(f"[+] Success! Seeded {result['persona_name']} ({result['signals_seeded']} signals across 14 days).")
    print(f"[i] Description: {result['description']}")

if __name__ == "__main__":
    main()
