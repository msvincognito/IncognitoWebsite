#!/usr/bin/env python3
"""Convert the Intro Camp agreement from DOCX into structured website data."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from docx import Document


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    return parser.parse_args()


def clean_text(value: str) -> str:
    return value.replace("\u00a0", " ").strip()


def classify(text: str) -> tuple[str, str]:
    if re.match(r"^\d+\.\d+(?:\.\d+)*\s+", text):
        return "subheading", text
    if re.match(r"^\d+\.\t", text):
        return "numbered", re.sub(r"^\d+\.\t+", "", text)
    if text.startswith("•"):
        return "bullet", text.removeprefix("•").lstrip("\t ")
    if re.match(r"^\d+\.\s+", text):
        return "heading", text
    return "paragraph", text


def main() -> None:
    args = parse_args()
    document = Document(args.source)
    paragraphs = [
        clean_text(paragraph.text)
        for paragraph in document.paragraphs
        if clean_text(paragraph.text)
        and not re.fullmatch(r"_+", clean_text(paragraph.text))
    ]

    title, subtitle, *body = paragraphs
    blocks: list[dict[str, object]] = []

    for text in body:
        block_type, content = classify(text)
        list_type = (
            "ordered-list"
            if block_type == "numbered"
            else "bullet-list"
            if block_type == "bullet"
            else None
        )

        if list_type:
            if blocks and blocks[-1]["type"] == list_type:
                blocks[-1]["items"].append(content)
            else:
                blocks.append({"type": list_type, "items": [content]})
        else:
            blocks.append({"type": block_type, "text": content})

    payload = {
        "title": title,
        "subtitle": subtitle,
        "blocks": blocks,
    }
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
