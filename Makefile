.PHONY: dev start stop db-push db-seed logs help

help:
	@echo "Democracy Direct - Development Commands"
	@echo ""
	@echo "  make dev       - Start mailpit + astro dev server"
	@echo "  make start     - Start mailpit only"
	@echo "  make stop      - Stop mailpit"
	@echo "  make db-push   - Push schema to Neon database"
	@echo "  make db-seed   - Import legislators and zip data"
	@echo "  make logs      - Follow mailpit logs"
	@echo ""
	@echo "Services:"
	@echo "  App:     http://localhost:4321"
	@echo "  Mailpit: http://localhost:8025"
	@echo ""
	@echo "Note: DATABASE_URL must point to a Neon database in .env"

start:
	docker-compose up -d
	@echo "Mailpit started at http://localhost:8025"

stop:
	docker-compose down

db-push:
	pnpm db:push

db-seed: db-push
	pnpm import:legislators
	pnpm import:zips
	pnpm seed:templates
	pnpm ensure:admins

logs:
	docker-compose logs -f

dev:
	docker-compose down --remove-orphans && docker-compose up -d
	@echo "Mailpit: http://localhost:8025"
	@trap 'docker-compose down' EXIT; pnpm dev
