import re
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter


MAX_CHUNK_SIZE = 5000
CHUNK_OVERLAP = 500


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=MAX_CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=[
        "\n\n",
        "\n",
        ". ",
        " ",
        "",
    ],
)


CHAPTER_PATTERN = re.compile(
    r"^(?:CHAPTER|Chapter)\s+([A-Za-z0-9IVXivx]+)"
)

NUMBERED_HEADING_PATTERN = re.compile(
    r"^(\d+(?:\.\d+){0,4})[.\)]?\s+(.+)$"
)

ROMAN_HEADING_PATTERN = re.compile(
    r"^(?:[IVX]+)[.\)]\s+(.+)$",
    re.IGNORECASE,
)

# Headings are short titles, not sentences. Anything longer than this,
# or ending like a sentence, is body text that happens to start with a number.
MAX_HEADING_LENGTH = 120


def detect_heading(
    line: str,
) -> tuple[str | None, str | None]:

    line = line.strip()

    if not line:
        return None, None

    chapter_match = CHAPTER_PATTERN.match(line)

    if chapter_match:
        return "chapter", line

    numbered_match = NUMBERED_HEADING_PATTERN.match(line)

    if numbered_match and len(line) <= MAX_HEADING_LENGTH and not line.endswith("."):

        number = numbered_match.group(1)

        depth = number.count(".") + 1

        if depth == 1:
            return "section", line

        return "subsection", line

    roman_match = ROMAN_HEADING_PATTERN.match(line)

    if roman_match and len(line) <= MAX_HEADING_LENGTH:
        return "section", line

    return None, None


def build_sections(
    pages: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    sections = []

    current_chapter = None
    current_section = None
    current_subsection = None

    current_content = []
    current_pages = []

    def flush_section():

        nonlocal current_content
        nonlocal current_pages

        if not current_content:
            return

        text = "\n".join(current_content).strip()

        if not text:
            return

        sections.append(
            {
                "chapter": current_chapter,
                "section": current_section,
                "subsection": current_subsection,
                "pages": sorted(set(current_pages)),
                "text": text,
            }
        )

        current_content = []
        current_pages = []

    for page in pages:

        page_number = page["page"]
        text = page["text"]

        for line in text.splitlines():

            stripped = line.strip()

            if not stripped:
                continue

            heading_type, heading_text = detect_heading(
                stripped
            )

            if heading_type == "chapter":

                flush_section()

                current_chapter = heading_text
                current_section = None
                current_subsection = None

                continue

            if heading_type == "section":

                flush_section()

                current_section = heading_text
                current_subsection = None

                continue

            if heading_type == "subsection":

                flush_section()

                current_subsection = heading_text

                continue

            current_content.append(stripped)
            current_pages.append(page_number)

    flush_section()

    return sections


def split_large_section(
    section: dict[str, Any],
) -> list[dict[str, Any]]:

    text = section["text"]

    if len(text) <= MAX_CHUNK_SIZE:
        return [section]

    split_texts = text_splitter.split_text(text)

    chunks = []

    for split_text in split_texts:

        chunks.append(
            {
                **section,
                "text": split_text,
            }
        )

    return chunks


def create_chunk(
    section: dict[str, Any],
    chunk_index: int,
) -> dict[str, Any]:

    return {
        "chunk_index": chunk_index,
        "chapter": section["chapter"],
        "section": section["section"],
        "subsection": section["subsection"],
        "pages": section["pages"],
        "text": section["text"],
    }


def chunk_document(
    pages: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    sections = build_sections(pages)

    chunks = []

    chunk_index = 0

    for section in sections:

        smaller_sections = split_large_section(
            section
        )

        for smaller_section in smaller_sections:

            chunk = create_chunk(
                smaller_section,
                chunk_index,
            )

            chunks.append(chunk)

            chunk_index += 1

    return chunks