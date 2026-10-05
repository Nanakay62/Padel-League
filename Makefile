.PHONY: dev worker migrate check check-mobile test-all

dev:
	docker compose -f infra/docker-compose.dev.yml up -d
	cd apps/api && uv run fastapi dev app/main.py --host 0.0.0.0

worker:
	cd apps/api && uv run procrastinate --app=app.jobs.app worker

migrate:
	cd apps/api && uv run alembic upgrade head

check:
	cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run mypy app && uv run pytest -q

check-mobile:
	cd apps/mobile && npm run lint && npm test && npx tsc --noEmit

test-all: check check-mobile
