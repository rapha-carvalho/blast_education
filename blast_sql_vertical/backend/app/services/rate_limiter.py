import threading
import time
from dataclasses import dataclass


@dataclass
class _WindowState:
    count: int
    window_start: int


_LOCK = threading.Lock()
_STATE: dict[str, _WindowState] = {}


def check_fixed_window_limit(key: str, *, limit: int, window_seconds: int) -> tuple[bool, int]:
    now = int(time.time())
    safe_limit = max(1, int(limit))
    safe_window = max(1, int(window_seconds))
    with _LOCK:
        state = _STATE.get(key)
        if state is None or (now - state.window_start) >= safe_window:
            _STATE[key] = _WindowState(count=1, window_start=now)
            return True, safe_window

        if state.count >= safe_limit:
            retry_after = max(1, safe_window - (now - state.window_start))
            return False, retry_after

        state.count += 1
        return True, max(1, safe_window - (now - state.window_start))
