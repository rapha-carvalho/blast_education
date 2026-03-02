#!/usr/bin/env python3
"""
Validate PT-BR content files for common encoding/corruption regressions.

Checks:
- U+FFFD replacement character (�)
- classic mojibake signatures (Ã¡, â€™, etc.)
- internal question marks inside words (aquisi??o)
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

MOJIBAKE_SEQUENCES = (
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


def iter_json_strings(value, pointer="$"):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from iter_json_strings(child, f"{pointer}.{key}")
        return
    if isinstance(value, list):
        for idx, child in enumerate(value):
            yield from iter_json_strings(child, f"{pointer}[{idx}]")
        return
    if isinstance(value, str):
        yield pointer, value


def find_internal_qmark_token(text: str) -> str | None:
    for token in re.findall(r"[A-Za-zÀ-ÿ0-9_?]+", text):
        if "?" not in token:
            continue
        if set(token) == {"?"}:
            continue
        if token.endswith("?") and token.count("?") == 1 and token[:-1].isalnum():
            continue
        return token
    return None


def check_text(text: str) -> list[str]:
    issues: list[str] = []
    if "\ufffd" in text:
        issues.append("contains_replacement_char")
    if any(seq in text for seq in MOJIBAKE_SEQUENCES):
        issues.append("contains_mojibake_signature")
    token = find_internal_qmark_token(text)
    if token:
        issues.append(f"contains_internal_qmark_token:{token}")
    return issues


def validate_file(path: Path, max_issues: int) -> list[str]:
    file_issues: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"{path}: invalid_json: {exc}"]

    for pointer, text in iter_json_strings(data):
        for issue in check_text(text):
            snippet = text.strip().replace("\n", " ")[:120]
            file_issues.append(f"{path}:{pointer}: {issue} :: {snippet}")
            if len(file_issues) >= max_issues:
                return file_issues
    return file_issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate PT-BR content encoding integrity.")
    parser.add_argument(
        "--content-dir",
        default="backend/content",
        help="Directory containing lesson/content JSON files.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=200,
        help="Maximum number of issues to print before stopping.",
    )
    args = parser.parse_args()

    content_dir = Path(args.content_dir)
    if not content_dir.exists():
        print(f"[ERROR] content dir not found: {content_dir}")
        return 2

    issues: list[str] = []
    for path in sorted(content_dir.rglob("*.json")):
        issues.extend(validate_file(path, max_issues=max(1, args.limit - len(issues))))
        if len(issues) >= args.limit:
            break

    if issues:
        print("[ERROR] PT-BR content validation failed:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("[OK] PT-BR content validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
