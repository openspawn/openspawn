.PHONY: install test lint format type-check clean

install:
	pip install -e ".[dev]"

test:
	pytest -v

test-cov:
	pytest --cov=openspawn --cov-report=html --cov-report=term

lint:
	ruff check src/ tests/

format:
	black src/ tests/

format-check:
	black --check src/ tests/

type-check:
	mypy src/

clean:
	rm -rf build/ dist/ *.egg-info .pytest_cache .coverage htmlcov/ .mypy_cache .ruff_cache
	find . -type d -name __pycache__ -exec rm -rf {} +

all: format lint type-check test
