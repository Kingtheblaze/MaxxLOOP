.PHONY: setup dev test demo clean lint docker-up docker-down

setup:
	@echo "Setting up MaxxLoop backend and frontend..."
	cd apps/api && python -m pip install -r requirements.txt
	cd apps/web && npm install

dev:
	@echo "Starting MaxxLoop development servers..."
	@echo "API will run at http://localhost:8000"
	@echo "Web will run at http://localhost:3000"
	# Run concurrently or in separate terminals:
	# Terminal 1: cd apps/api && uvicorn app.main:app --reload --port 8000
	# Terminal 2: cd apps/web && npm run dev

test:
	@echo "Running backend test suite..."
	cd apps/api && pytest -v tests/

demo:
	@echo "Starting MaxxLoop in 90-Second Demo Mode..."
	cd apps/api && python ../../scripts/seed_demo.py --persona aarav
	# API on 8000 and Web on 3000

simulate:
	@echo "Running 200-user synthetic simulation..."
	cd apps/api && python ../../scripts/simulate_users.py

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

clean:
	rm -f apps/api/maxxloop.db
	rm -rf apps/api/__pycache__ apps/api/.pytest_cache
