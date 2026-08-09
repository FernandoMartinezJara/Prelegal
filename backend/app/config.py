import os
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent


def _resolve_repo_root() -> Path:
    # In local dev, backend/ sits one level below the repo root, so
    # repo-root files (templates/, catalog.json) are at backend/../.
    # In the Docker image, backend/'s contents are flattened directly into
    # WORKDIR /app, so those files are copied alongside it instead.
    if (_BACKEND_DIR.parent / "templates").is_dir():
        return _BACKEND_DIR.parent
    return _BACKEND_DIR


TEMPLATES_DIR = Path(os.environ.get("TEMPLATES_DIR", str(_resolve_repo_root() / "templates")))
CATALOG_PATH = Path(os.environ.get("CATALOG_PATH", str(_resolve_repo_root() / "catalog.json")))
