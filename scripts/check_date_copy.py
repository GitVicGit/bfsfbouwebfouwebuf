#!/usr/bin/env python3
"""Check dated 'Upcoming' copy before publishing the static site.

Put <time datetime="YYYY-MM-DD"> around the start date in any row that
uses an Upcoming / À venir label. Undated labels are reported for manual review.
"""

import argparse
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
STATUS = re.compile(r"\bupcoming\b|à\s+venir", re.IGNORECASE)


class DatedRowParser(HTMLParser):
    def __init__(self, path, as_of):
        super().__init__()
        self.path = path
        self.as_of = as_of
        self.depth = 0
        self.text = []
        self.dates = []
        self.row_line = 0
        self.dated_rows = 0
        self.stale = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if not self.depth:
            if tag == "div" and "row" in attrs.get("class", "").split():
                self.depth = 1
                self.text = []
                self.dates = []
                self.row_line = self.getpos()[0]
            return

        if tag == "div":
            self.depth += 1
        elif tag == "time" and attrs.get("datetime"):
            try:
                self.dates.append(date.fromisoformat(attrs["datetime"]))
            except ValueError:
                self.stale.append((self.row_line, "invalid <time> date"))

    def handle_data(self, data):
        if self.depth:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag != "div" or not self.depth:
            return
        self.depth -= 1
        if self.depth:
            return

        if self.dates:
            self.dated_rows += 1
        if STATUS.search(" ".join(self.text)) and self.dates:
            start = min(self.dates)
            if start <= self.as_of:
                self.stale.append((self.row_line, f"upcoming label after {start}"))


def main():
    argument_parser = argparse.ArgumentParser(description=__doc__)
    argument_parser.add_argument(
        "--as-of", type=date.fromisoformat, default=date.today(),
        help="date to check (YYYY-MM-DD; defaults to today)",
    )
    args = argument_parser.parse_args()

    dated_rows = 0
    stale = []
    undated = []
    for path in sorted(ROOT.rglob("index.html")):
        source = path.read_text(encoding="utf-8")
        parser = DatedRowParser(path, args.as_of)
        parser.feed(source)
        dated_rows += parser.dated_rows
        stale.extend((path.relative_to(ROOT), line, message) for line, message in parser.stale)
        for line_number, line in enumerate(source.splitlines(), start=1):
            if STATUS.search(line) and "<time datetime=" not in line:
                undated.append((path.relative_to(ROOT), line_number))

    print(f"Date-copy check ({args.as_of}): {dated_rows} dated rows, {len(stale)} stale labels")
    for path, line, message in stale:
        print(f"ERROR {path}:{line}: {message}")
    for path, line in undated:
        print(f"REVIEW {path}:{line}: undated Upcoming / À venir copy")
    return 1 if stale else 0


if __name__ == "__main__":
    raise SystemExit(main())
