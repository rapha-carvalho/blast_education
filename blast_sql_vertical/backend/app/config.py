import os
from pathlib import Path

CONTENT_DIR = Path(os.getenv("CONTENT_DIR", Path(__file__).parent.parent / "content"))
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", 10240))
