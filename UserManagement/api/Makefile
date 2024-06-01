#Colors
GREEN=\033[0;32m
RESET=\033[0m

MANAGE_PY_PATH = ./django_application/manage.py

run:
	python $(MANAGE_PY_PATH) runserver

migrate:
	python $(MANAGE_PY_PATH) makemigrations
	python $(MANAGE_PY_PATH) migrate

test:
# python $(MANAGE_PY_PATH) collectstatic
	python $(MANAGE_PY_PATH) test --parallel auto

dump_database:
	python $(MANAGE_PY_PATH) clearsessions
	python $(MANAGE_PY_PATH) dumpdata > db.json

delete_database:
	python $(MANAGE_PY_PATH) sqlflush | python $(MANAGE_PY_PATH) dbshell

load_database:
	python $(MANAGE_PY_PATH) loaddata db.json

create_python_env:
	python3 -m venv .venv
	. .venv/bin/activate && pip install -r requirements.txt
	@echo "$(GREEN)To activate the virtual environment, run the following command:$(RESET)"
	@echo "$(GREEN)source .venv/bin/activate$(RESET)"

recreate_python_env:
	rm -rf .venv
	$(MAKE) create_python_env