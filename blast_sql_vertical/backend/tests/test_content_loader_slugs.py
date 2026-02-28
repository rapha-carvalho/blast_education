"""Tests for content_loader slug generation and resolution."""

import pytest

from app.services.content_loader import (
    _title_to_slug,
    resolve_lesson_by_slug,
    resolve_lesson_key_to_slug,
    load_courses,
)


class TestTitleToSlug:
    def test_basic_title(self):
        assert _title_to_slug("O que é SQL?") == "o-que-e-sql"

    def test_ptbr_accents(self):
        assert _title_to_slug("Introdução ao Banco de Dados") == "introducao-ao-banco-de-dados"

    def test_empty_title(self):
        assert _title_to_slug("") == ""
        assert _title_to_slug(None) == ""

    def test_collapse_hyphens(self):
        assert _title_to_slug("  word   word  ") == "word-word"

    def test_strip_non_alphanumeric(self):
        assert _title_to_slug("Hello, World!") == "hello-world"


class TestResolveLesson:
    @pytest.fixture(autouse=True)
    def _ensure_content(self):
        load_courses()

    def test_resolve_lesson_by_slug_returns_metadata(self):
        result = resolve_lesson_by_slug("sql-basico-avancado", "o-que-e-sql-e-por-que-isso-importa")
        assert result is not None
        assert result["lesson_key"] == "lesson_m1_1"
        assert "lesson_slug" in result
        assert "lesson_title" in result

    def test_resolve_lesson_by_slug_invalid_returns_none(self):
        assert resolve_lesson_by_slug("sql-basico-avancado", "nao-existe") is None
        assert resolve_lesson_by_slug("curso-inexistente", "qualquer") is None

    def test_resolve_lesson_key_to_slug(self):
        slug = resolve_lesson_key_to_slug("sql-basico-avancado", "lesson_m1_1")
        assert slug is not None
        assert isinstance(slug, str)
        assert len(slug) > 0

    def test_resolve_master_challenge_slug(self):
        result = resolve_lesson_by_slug("sql-basico-avancado", "desafio-final")
        assert result is not None
        assert result["lesson_key"] == "lesson_master_challenge_1"
        assert result["lesson_slug"] == "desafio-final"
