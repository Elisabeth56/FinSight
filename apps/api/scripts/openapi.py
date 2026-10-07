"""Prints the API's OpenAPI schema as JSON, for the web app's generated types."""

import json
import os

# settings validate at import; the schema doesn't need a real database
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/unused")

from app.main import app  # noqa: E402

print(json.dumps(app.openapi(), indent=2, sort_keys=True))
