#!/usr/bin/env python3
"""Build docs/schedule.json from Metra GTFS static data.

This is intentionally a placeholder for the next phase. The starter repo uses a
hand-authored fixture at docs/schedule.json so the Scriptable widget can be
tested before the GTFS parser is written.
"""

from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "docs" / "schedule.json"


def main() -> None:
    if not OUTPUT.exists():
        raise SystemExit("docs/schedule.json is missing")

    print(f"Fixture schedule is present: {OUTPUT}")
    print("Next phase: replace this placeholder with the GTFS preprocessor.")


if __name__ == "__main__":
    main()
