"""Export FastAPI OpenAPI schema to JSON file."""

import json
import sys
from pathlib import Path

# Add the api root to sys.path so 'app' package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402

json.dump(app.openapi(), sys.stdout, indent=2)
