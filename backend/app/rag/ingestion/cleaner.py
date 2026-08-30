import re
import unicodedata
from collections import Counter
from typing import Any


def normalize_unicode(text: str) -> str:
    return unicodedata.normalize("NFKC", text)


def normalize_whitespace(text: str) -> str:
    text = text.replace("\t", " ")
    text = "\n".join(line.rstrip() for line in text.splitlines())
    text = re.sub(r"[ ]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def remove_page_number(text: str) -> str:
    lines = text.splitlines()
    cleaned = []

    for line in lines:
        stripped = line.strip()

        if re.fullmatch(r"\d+", stripped):
            continue

        if re.fullmatch(
            r"[-–—]?\s*page\s+\d+\s*[-–—]?",
            stripped,
            re.IGNORECASE,
        ):
            continue

        if re.fullmatch(r"[-–—]?\s*\d+\s*[-–—]?", stripped):
            continue

        cleaned.append(line)

    return "\n".join(cleaned)


MAX_BOILERPLATE_LENGTH = 80


def remove_repeated_lines(
    pages: list[dict[str, Any]],
    min_occurrences: int = 3,
) -> list[dict[str, Any]]:
    line_counts = Counter()

    for page in pages:
        seen_on_page = set()

        for line in page["text"].splitlines():
            normalized = line.strip()

            if normalized:
                seen_on_page.add(normalized)

        for line in seen_on_page:
            line_counts[line] += 1

    # Only short lines (headers/footers, e.g. "Namma Raste 2025", "Page 3")
    # are treated as boilerplate. Longer repeated lines are more likely to
    # be real recurring content (e.g. a repeated clause) and are kept.
    repeated_lines = {
        line
        for line, count in line_counts.items()
        if count >= min_occurrences and len(line) <= MAX_BOILERPLATE_LENGTH
    }

    cleaned_pages = []

    for page in pages:
        cleaned_lines = []

        for line in page["text"].splitlines():
            if line.strip() in repeated_lines:
                continue

            cleaned_lines.append(line)

        cleaned_pages.append(
            {
                **page,
                "text": "\n".join(cleaned_lines),
            }
        )

    return cleaned_pages


def clean_page_text(text: str) -> str:
    text = normalize_unicode(text)
    text = remove_page_number(text)
    text = normalize_whitespace(text)

    return text


def clean_document(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cleaned_pages = []

    for page in pages:
        cleaned_text = clean_page_text(page["text"])

        cleaned_pages.append(
            {
                **page,
                "text": cleaned_text,
            }
        )

    cleaned_pages = remove_repeated_lines(cleaned_pages)

    for page in cleaned_pages:
        page["text"] = normalize_whitespace(page["text"])

    return cleaned_pages