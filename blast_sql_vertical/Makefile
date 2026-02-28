# Makefile – blast_sql_vertical
# Shortcuts for local dev and NAS deployment.
# Requires: docker, docker compose, python 3.11+, node 20+

COMPOSE        = docker compose -f docker-compose.yml
COMPOSE_PROD   = docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod
BACKEND_DIR    = backend
FRONTEND_DIR   = frontend

.PHONY: help dev dev-build dev-down test lint \
        prod-pull prod-up prod-down prod-logs prod-health prod-shell-backend \
        backup

help:           ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Local development ────────────────────────────────────────────────────────

dev:            ## Start local stack (uses cached images)
	$(COMPOSE) up -d

dev-build:      ## Build and start local stack
	$(COMPOSE) up -d --build

dev-down:       ## Stop local stack
	$(COMPOSE) down

dev-logs:       ## Tail local stack logs
	$(COMPOSE) logs -f

# ── Tests & lint ─────────────────────────────────────────────────────────────

test:           ## Run backend tests
	cd $(BACKEND_DIR) && \
		USER_DB_PATH=/tmp/blast_test_$$(date +%s).db \
		pytest tests/ -v --tb=short

lint:           ## Lint backend Python
	cd $(BACKEND_DIR) && \
		python -m py_compile $$(find app -name '*.py') && echo "syntax OK"

# ── Production (NAS) ─────────────────────────────────────────────────────────

prod-pull:      ## Pull latest images from GHCR
	$(COMPOSE_PROD) pull

prod-up:        ## Start / update production stack
	$(COMPOSE_PROD) up -d

prod-down:      ## Stop production stack
	$(COMPOSE_PROD) down

prod-logs:      ## Tail production logs
	$(COMPOSE_PROD) logs -f

prod-health:    ## Show container health status
	$(COMPOSE_PROD) ps

prod-shell-backend: ## Open a shell in the running backend container
	$(COMPOSE_PROD) exec backend /bin/bash

# ── Backup ───────────────────────────────────────────────────────────────────

backup:         ## Run a manual SQLite backup (writes to /backups/blast-sql/)
	bash deploy/backup.sh
