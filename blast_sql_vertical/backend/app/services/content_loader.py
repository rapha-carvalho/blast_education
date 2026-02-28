import copy
import json
import logging
import re
import unicodedata
from pathlib import Path

from app.config import CONTENT_DIR, STRICT_CONTENT_VALIDATION

logger = logging.getLogger(__name__)

_COURSES_CACHE: dict | None = None
_LESSON_CACHE: dict[str, dict] = {}
_CONTENT_READY = False

_MOJIBAKE_SCORE_MARKERS = ("\u00c3", "\u00c2", "\u00f0", "\ufffd")
_MOJIBAKE_SEQUENCES = (
    "Ã¡",
    "Ã¢",
    "Ã£",
    "Ã©",
    "Ãª",
    "Ã­",
    "Ã³",
    "Ã´",
    "Ãµ",
    "Ãº",
    "Ã§",
    "Ã",
    "Ã‰",
    "Ã“",
    "Ãš",
    "Ã‡",
    "Â ",
    "Â·",
    "â€“",
    "â€”",
    "â€œ",
    "â€",
    "â€˜",
    "â€™",
    "â€¦",
    "â€¢",
    "â‚¬",
    "ðŸ",
)
_QUESTION_MARK_WORD_FIXES = (
    ("aquisi??o", "aquisi\u00e7\u00e3o"),
    ("Descri??o", "Descri\u00e7\u00e3o"),
    ("descri??o", "descri\u00e7\u00e3o"),
    ("produ??o", "produ\u00e7\u00e3o"),
    ("medi??o", "medi\u00e7\u00e3o"),
    ("M?trica", "M\u00e9trica"),
    ("m?trica", "m\u00e9trica"),
    ("P?blico", "P\u00fablico"),
    ("p?blico", "p\u00fablico"),
    ("l?gica", "l\u00f3gica"),
    ("L?gica", "L\u00f3gica"),
    ("l?quida", "l\u00edquida"),
    ("L?quida", "L\u00edquida"),
    ("r?pido", "r\u00e1pido"),
    ("R?pido", "R\u00e1pido"),
    ("est?", "est\u00e1"),
    ("Est?", "Est\u00e1"),
    ("?nico", "\u00fanico"),
    ("?nica", "\u00fanica"),
    ("?nicos", "\u00fanicos"),
    ("?nicas", "\u00fanicas"),
)
_REPLACEMENT_CHAR_WORD_FIXES = (
    ("Voc\ufffd", "Voc\u00ea"),
    ("voc\ufffd", "voc\u00ea"),
    ("j\ufffd", "j\u00e1"),
    ("N\ufffdo", "N\u00e3o"),
    ("n\ufffdo", "n\u00e3o"),
    ("m\ufffds", "m\u00eas"),
    ("mar\ufffdo", "mar\u00e7o"),
    ("milh\ufffdes", "milh\u00f5es"),
    ("v\ufffdrios", "v\u00e1rios"),
    ("exporta\ufffd\ufffdo", "exporta\u00e7\u00e3o"),
    ("decis\ufffdes", "decis\u00f5es"),
    ("programa\ufffd\ufffdo", "programa\u00e7\u00e3o"),
    ("est\ufffdo", "est\u00e3o"),
    ("t\ufffdm", "t\u00eam"),
    ("\ufffd uma ", "\u00e9 uma "),
    ("\ufffd um ", "\u00e9 um "),
    ("\ufffd o ", "\u00e9 o "),
    ("\ufffd a ", "\u00e9 a "),
)
_CONTENT_ISSUE_LIMIT = 25


def _mojibake_score(text: str) -> int:
    return sum(text.count(ch) for ch in _MOJIBAKE_SCORE_MARKERS)


def _has_mojibake_hint(text: str) -> bool:
    if "\ufffd" in text:
        return True
    return any(seq in text for seq in _MOJIBAKE_SEQUENCES)


def _decode_mojibake_candidate(text: str, source_encoding: str) -> str:
    try:
        return text.encode(source_encoding).decode("utf-8")
    except UnicodeError:
        return text


def _normalize_text(value: str) -> str:
    if not isinstance(value, str):
        return value

    out = unicodedata.normalize("NFC", value)
    for bad, good in _QUESTION_MARK_WORD_FIXES:
        out = out.replace(bad, good)
    for bad, good in _REPLACEMENT_CHAR_WORD_FIXES:
        out = out.replace(bad, good)

    for _ in range(3):
        if not _has_mojibake_hint(out):
            break
        current_score = _mojibake_score(out)
        candidates = (
            _decode_mojibake_candidate(out, "latin-1"),
            _decode_mojibake_candidate(out, "cp1252"),
        )
        best = out
        best_score = current_score
        for candidate in candidates:
            score = _mojibake_score(candidate)
            if score < best_score:
                best = candidate
                best_score = score
        if best == out:
            break
        out = unicodedata.normalize("NFC", best)

    for bad, good in _QUESTION_MARK_WORD_FIXES:
        out = out.replace(bad, good)
    for bad, good in _REPLACEMENT_CHAR_WORD_FIXES:
        out = out.replace(bad, good)
    return out


def _normalize_payload(value):
    if isinstance(value, dict):
        return {k: _normalize_payload(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize_payload(v) for v in value]
    if isinstance(value, str):
        return _normalize_text(value)
    return value


def _find_internal_qmark_token(text: str) -> str | None:
    for token in re.findall(r"[A-Za-zÀ-ÿ0-9_?]+", text):
        if "?" not in token:
            continue
        if set(token) == {"?"}:
            continue
        if token.endswith("?") and token.count("?") == 1 and token[:-1].isalnum():
            continue
        return token
    return None


def _collect_text_issues(text: str) -> list[str]:
    issues: list[str] = []
    if "\ufffd" in text:
        issues.append("contains_replacement_char")
    if any(seq in text for seq in _MOJIBAKE_SEQUENCES):
        issues.append("contains_mojibake_signature")
    q_token = _find_internal_qmark_token(text)
    if q_token:
        issues.append(f"contains_internal_qmark_token:{q_token}")
    return issues


def _collect_payload_issues(value, pointer: str = "$", out: list[str] | None = None) -> list[str]:
    issues = out if out is not None else []
    if len(issues) >= _CONTENT_ISSUE_LIMIT:
        return issues

    if isinstance(value, dict):
        for key, child in value.items():
            _collect_payload_issues(child, f"{pointer}.{key}", issues)
            if len(issues) >= _CONTENT_ISSUE_LIMIT:
                break
        return issues

    if isinstance(value, list):
        for idx, child in enumerate(value):
            _collect_payload_issues(child, f"{pointer}[{idx}]", issues)
            if len(issues) >= _CONTENT_ISSUE_LIMIT:
                break
        return issues

    if isinstance(value, str):
        text_issues = _collect_text_issues(value)
        for issue in text_issues:
            snippet = value.strip().replace("\n", " ")[:120]
            issues.append(f"{pointer}: {issue} :: {snippet}")
            if len(issues) >= _CONTENT_ISSUE_LIMIT:
                break
    return issues


def _safe_text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def _fallback_hint_level_1(exercise: dict, challenge_number: int) -> str:
    title = _safe_text(exercise.get("title"))
    if title:
        return (
            f"Releia o enunciado de \"{title}\" e monte a query em blocos: "
            "SELECT, FROM e filtros/ordenacao."
        )
    return (
        f"Desafio {challenge_number}: comece com SELECT ... FROM ... "
        "e adicione apenas os filtros pedidos no texto."
    )


def _fallback_hint_level_2(exercise: dict) -> str:
    solution = _safe_text(exercise.get("solution_query"))
    if solution:
        for line in solution.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("--"):
                return f"Use esta estrutura como referencia: {stripped}"
    return "Monte uma query SELECT com as colunas pedidas e os filtros exatos do enunciado."


def _harden_exercises(lesson: dict) -> tuple[int, int]:
    exercises = lesson.get("exercises")
    if not isinstance(exercises, list):
        return 0, 0

    starter_cleared = 0
    hints_autofilled = 0

    for idx, exercise in enumerate(exercises):
        if not isinstance(exercise, dict):
            continue

        if _safe_text(exercise.get("starter_query")):
            starter_cleared += 1
        # Challenge editor must always start empty.
        exercise["starter_query"] = ""
        # Keep error assistant opt-in deterministic for all challenges.
        exercise["error_assist_enabled"] = True

        if not _safe_text(exercise.get("hint_level_1")):
            exercise["hint_level_1"] = _fallback_hint_level_1(exercise, idx + 1)
            hints_autofilled += 1
        if not _safe_text(exercise.get("hint_level_2")):
            exercise["hint_level_2"] = _fallback_hint_level_2(exercise)
            hints_autofilled += 1

    return starter_cleared, hints_autofilled


def _load_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        with open(path, encoding="utf-8") as f:
            parsed = json.load(f)
    except Exception as exc:
        logger.error("Failed to parse JSON content file: %s (%s)", path, exc)
        return None
    return parsed if isinstance(parsed, dict) else None


def _lesson_ids(module: dict) -> list[str]:
    lessons = module.get("lessons", [])
    ids: list[str] = []
    for lesson in lessons:
        if isinstance(lesson, str):
            ids.append(lesson)
        elif isinstance(lesson, dict) and isinstance(lesson.get("id"), str):
            ids.append(lesson["id"])
    return ids


def _content_path(course: dict, module: dict) -> Path:
    """Resolve lesson directory from course and module ids (slug: replace - with _)."""
    course_slug = (course.get("content_path") or course.get("id") or "").replace("-", "_")
    module_slug = (module.get("path") or module.get("id") or "").replace("-", "_")
    return CONTENT_DIR / course_slug / module_slug


def _title_to_slug(title: str) -> str:
    """Convert lesson title to URL-safe slug. Lowercase, strip accents, hyphenate."""
    if not title or not isinstance(title, str):
        return ""
    nfd = unicodedata.normalize("NFD", title)
    ascii_chars = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    slug = ascii_chars.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "lesson"


# Explicit slug overrides for special lessons (e.g. master challenge)
_LESSON_SLUG_OVERRIDES: dict[str, str] = {
    "lesson_master_challenge_1": "desafio-final",
}


def _enrich_courses_with_slugs(courses_data: dict) -> None:
    """Add slug field to each lesson in courses tree. Mutates in place."""
    for course in courses_data.get("courses", []):
        if not isinstance(course, dict):
            continue
        seen_slugs: set[str] = set()
        for module in course.get("modules", []):
            if not isinstance(module, dict):
                continue
            for lesson in module.get("lessons", []):
                if not isinstance(lesson, dict):
                    continue
                lesson_id = lesson.get("id")
                title = lesson.get("title", "")
                if lesson_id in _LESSON_SLUG_OVERRIDES:
                    base = _LESSON_SLUG_OVERRIDES[lesson_id]
                else:
                    base = _title_to_slug(title) or "lesson"
                slug = base
                suffix = 2
                while slug in seen_slugs:
                    slug = f"{base}-{suffix}"
                    suffix += 1
                seen_slugs.add(slug)
                lesson["slug"] = slug


def initialize_runtime_content() -> None:
    refresh_content_cache()


def refresh_content_cache() -> None:
    global _COURSES_CACHE, _LESSON_CACHE, _CONTENT_READY

    courses_path = CONTENT_DIR / "courses.json"
    courses_raw = _load_json(courses_path) or {"courses": []}
    courses = _normalize_payload(courses_raw)
    if not isinstance(courses, dict):
        courses = {"courses": []}
    if not isinstance(courses.get("courses"), list):
        courses["courses"] = []

    _enrich_courses_with_slugs(courses)

    lesson_cache: dict[str, dict] = {}
    starter_cleared = 0
    hints_autofilled = 0
    exercise_count = 0

    for course in courses.get("courses", []):
        if not isinstance(course, dict):
            continue
        for module in course.get("modules", []):
            if not isinstance(module, dict):
                continue
            lesson_dir = _content_path(course, module)
            for lesson_id in _lesson_ids(module):
                path = lesson_dir / f"{lesson_id}.json"
                lesson_raw = _load_json(path)
                if lesson_raw is None:
                    continue
                lesson = _normalize_payload(lesson_raw)
                if not isinstance(lesson, dict):
                    continue

                cleared, autofilled = _harden_exercises(lesson)
                starter_cleared += cleared
                hints_autofilled += autofilled
                exercise_count += len(get_lesson_exercises(lesson))
                lesson_cache[lesson_id] = lesson

    _COURSES_CACHE = courses
    _LESSON_CACHE = lesson_cache
    _CONTENT_READY = True

    content_issues = _collect_payload_issues(courses)
    if len(content_issues) < _CONTENT_ISSUE_LIMIT:
        for lesson_id, lesson in lesson_cache.items():
            _collect_payload_issues(lesson, f"lesson:{lesson_id}", content_issues)
            if len(content_issues) >= _CONTENT_ISSUE_LIMIT:
                break

    if content_issues:
        msg = "Content integrity validation failed:\n- " + "\n- ".join(content_issues)
        if STRICT_CONTENT_VALIDATION:
            raise RuntimeError(msg)
        logger.warning(msg)

    logger.info(
        "Content cache ready: %s lessons, %s exercises, %s starter queries cleared, %s hints auto-filled.",
        len(_LESSON_CACHE),
        exercise_count,
        starter_cleared,
        hints_autofilled,
    )


def _ensure_content_ready() -> None:
    if not _CONTENT_READY:
        refresh_content_cache()


def load_courses() -> dict:
    _ensure_content_ready()
    return copy.deepcopy(_COURSES_CACHE or {"courses": []})


def load_lesson(lesson_id: str) -> dict | None:
    if not lesson_id:
        return None
    _ensure_content_ready()
    lesson = _LESSON_CACHE.get(lesson_id)
    return copy.deepcopy(lesson) if lesson else None


def get_lesson_exercises(lesson: dict | None) -> list[dict]:
    if not lesson:
        return []
    exercises = lesson.get("exercises")
    if not isinstance(exercises, list):
        return []
    return [exercise for exercise in exercises if isinstance(exercise, dict)]


_COURSE_SLUG_TO_ID: dict[str, str] = {
    "sql-basico-avancado": "sql-basics",
}


def resolve_lesson_by_slug(course_slug: str, lesson_slug: str) -> dict | None:
    """Resolve course_slug + lesson_slug to lesson metadata including lesson_key."""
    _ensure_content_ready()
    course_id = _COURSE_SLUG_TO_ID.get(course_slug) or course_slug
    courses = _COURSES_CACHE or {}
    for course in courses.get("courses", []):
        if not isinstance(course, dict) or course.get("id") != course_id:
            continue
        for module in course.get("modules", []):
            if not isinstance(module, dict):
                continue
            for lesson in module.get("lessons", []):
                if not isinstance(lesson, dict):
                    continue
                if lesson.get("slug") == lesson_slug:
                    return {
                        "lesson_key": lesson.get("id"),
                        "lesson_slug": lesson.get("slug"),
                        "lesson_title": lesson.get("title"),
                    }
    return None


def resolve_lesson_key_to_slug(course_slug: str, lesson_key: str) -> str | None:
    """Resolve lesson_key to lesson_slug for the given course_slug."""
    _ensure_content_ready()
    course_id = _COURSE_SLUG_TO_ID.get(course_slug) or course_slug
    courses = _COURSES_CACHE or {}
    for course in courses.get("courses", []):
        if not isinstance(course, dict) or course.get("id") != course_id:
            continue
        for module in course.get("modules", []):
            if not isinstance(module, dict):
                continue
            for lesson in module.get("lessons", []):
                if not isinstance(lesson, dict):
                    continue
                if lesson.get("id") == lesson_key:
                    return lesson.get("slug")
    return None

