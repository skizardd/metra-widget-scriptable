#!/usr/bin/env python3
"""Build the large-widget UP-N Kenilworth/OTC schedule JSON from GTFS."""

from __future__ import annotations

import csv
import json
import re
import zipfile
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GTFS_ZIP = ROOT / "schedule.zip"
OUTPUT = ROOT / "docs" / "up-n-kenilworth-otc-large.json"
SOURCE_URL = "https://schedules.metrarail.com/gtfs/schedule.zip"

ROUTE_ID = "UP-N"
ROUTE_NAME = "Union Pacific North"
LEGS = {
    "kenilworth_inbound": {
        "label": "Kenilworth to Chicago OTC",
        "short_label": "KENILWORTH -> OTC",
        "direction": "inbound",
        "direction_id": "1",
        "origin": "KENILWORTH",
        "destination": "OTC",
    },
    "otc_outbound": {
        "label": "Chicago OTC to Kenilworth",
        "short_label": "OTC -> KENILWORTH",
        "direction": "outbound",
        "direction_id": "0",
        "origin": "OTC",
        "destination": "KENILWORTH",
    },
}


def clean_row(row: dict[str, str]) -> dict[str, str]:
    return {key.strip(): value.strip() for key, value in row.items()}


def read_rows(archive: zipfile.ZipFile, name: str) -> list[dict[str, str]]:
    with archive.open(name) as raw:
        text = (line.decode("utf-8-sig") for line in raw)
        return [clean_row(row) for row in csv.DictReader(text)]


def gtfs_date(value: str) -> date:
    return datetime.strptime(value, "%Y%m%d").date()


def calendar_patterns(row: dict[str, str]) -> set[str]:
    patterns: set[str] = set()
    if all(row[day] == "1" for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]):
        patterns.add("weekday")
    if row["saturday"] == "1":
        patterns.add("saturday")
    if row["sunday"] == "1":
        patterns.add("sunday")
    return patterns


def normalize_time(value: str) -> tuple[str, int]:
    hours, minutes, _seconds = (int(part) for part in value.split(":"))
    return f"{hours % 24:02d}:{minutes:02d}", hours * 60 + minutes


def train_number(trip_id: str) -> str:
    match = re.search(r"_UN(\d+)_", trip_id)
    return match.group(1) if match else trip_id


def active_calendar_rows(rows: list[dict[str, str]], today: date) -> list[dict[str, str]]:
    active = [row for row in rows if gtfs_date(row["start_date"]) <= today <= gtfs_date(row["end_date"])]
    if active:
        return active

    # If the local clock falls outside the GTFS range, use the newest range in the feed.
    latest_start = max(gtfs_date(row["start_date"]) for row in rows)
    return [row for row in rows if gtfs_date(row["start_date"]) == latest_start]


def trip_stop_map(stop_times: list[dict[str, str]]) -> dict[str, dict[str, dict[str, str]]]:
    by_trip: dict[str, dict[str, dict[str, str]]] = defaultdict(dict)
    for row in stop_times:
        by_trip[row["trip_id"]][row["stop_id"]] = row
    return by_trip


def build_leg_departures(
    leg: dict[str, str],
    trips: list[dict[str, str]],
    stops_by_trip: dict[str, dict[str, dict[str, str]]],
    service_patterns: dict[str, set[str]],
) -> tuple[dict[str, list[dict[str, str]]], dict[str, list[str]]]:
    departures: dict[str, list[dict[str, str]]] = {"weekday": [], "saturday": [], "sunday": []}
    used_service_ids: dict[str, set[str]] = {"weekday": set(), "saturday": set(), "sunday": set()}

    for trip in trips:
        if trip["route_id"] != ROUTE_ID or trip["direction_id"] != leg["direction_id"]:
            continue

        trip_stops = stops_by_trip.get(trip["trip_id"], {})
        origin_stop = trip_stops.get(leg["origin"])
        destination_stop = trip_stops.get(leg["destination"])
        if not origin_stop or not destination_stop:
            continue

        origin_sequence = int(origin_stop["stop_sequence"])
        destination_sequence = int(destination_stop["stop_sequence"])
        if origin_sequence >= destination_sequence:
            continue

        depart, depart_sort = normalize_time(origin_stop["departure_time"])
        arrive, arrive_sort = normalize_time(destination_stop["arrival_time"])
        item = {
            "train": train_number(trip["trip_id"]),
            "depart": depart,
            "depart_minutes": depart_sort,
            "arrive": arrive,
            "arrive_minutes": arrive_sort,
            "headsign": trip["trip_headsign"],
        }

        for pattern in service_patterns.get(trip["service_id"], set()):
            if pattern in departures:
                departures[pattern].append({**item, "_sort": depart_sort})
                used_service_ids[pattern].add(trip["service_id"])

    for pattern, rows in departures.items():
        rows.sort(key=lambda row: (int(row["_sort"]), int(row["train"]) if row["train"].isdigit() else 99999))
        for row in rows:
            del row["_sort"]

    return departures, {pattern: sorted(ids) for pattern, ids in used_service_ids.items()}


def build_exceptions(
    calendar_dates: list[dict[str, str]],
    service_patterns: dict[str, set[str]],
) -> dict[str, str]:
    exceptions: dict[str, str] = {}
    by_date: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in calendar_dates:
        by_date[row["date"]].append(row)

    for raw_date, rows in by_date.items():
        additions = [row for row in rows if row["exception_type"] == "1"]
        for addition in additions:
            patterns = sorted(service_patterns.get(addition["service_id"], []))
            if patterns:
                exceptions[f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:]}"] = patterns[0]
                break

    return exceptions


def main() -> None:
    if not GTFS_ZIP.exists():
        raise SystemExit(f"Missing {GTFS_ZIP}. Download {SOURCE_URL} first.")

    today = date.today()
    with zipfile.ZipFile(GTFS_ZIP) as archive:
        stops = {row["stop_id"]: row for row in read_rows(archive, "stops.txt")}
        trips = read_rows(archive, "trips.txt")
        stop_times = read_rows(archive, "stop_times.txt")
        calendar = read_rows(archive, "calendar.txt")
        calendar_dates = read_rows(archive, "calendar_dates.txt")

    active_rows = active_calendar_rows(calendar, today)
    service_patterns = {row["service_id"]: calendar_patterns(row) for row in active_rows}
    stops_by_trip = trip_stop_map(stop_times)

    legs = {}
    all_service_ids: dict[str, set[str]] = {"weekday": set(), "saturday": set(), "sunday": set()}
    for key, leg in LEGS.items():
        departures, service_ids = build_leg_departures(leg, trips, stops_by_trip, service_patterns)
        for pattern, ids in service_ids.items():
            all_service_ids[pattern].update(ids)

        legs[key] = {
            "label": leg["label"],
            "short_label": leg["short_label"],
            "direction": leg["direction"],
            "direction_id": leg["direction_id"],
            "origin": {
                "id": leg["origin"],
                "name": stops[leg["origin"]]["stop_name"],
            },
            "destination": {
                "id": leg["destination"],
                "name": stops[leg["destination"]]["stop_name"],
            },
            "departures": departures,
        }

    output = {
        "version": f"gtfs-{today.isoformat()}",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source": SOURCE_URL,
        "route": {
            "id": ROUTE_ID,
            "name": ROUTE_NAME,
        },
        "widget": {
            "family": "large",
            "rows_per_section": 5,
            "sections": ["kenilworth_inbound", "otc_outbound"],
        },
        "time_format": "HH:MM",
        "time_zone": "America/Chicago",
        "service_ids": {pattern: sorted(ids) for pattern, ids in all_service_ids.items()},
        "exceptions": build_exceptions(calendar_dates, service_patterns),
        "legs": legs,
    }

    OUTPUT.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    for key, leg in output["legs"].items():
        counts = {pattern: len(rows) for pattern, rows in leg["departures"].items()}
        print(f"{key}: {counts}")


if __name__ == "__main__":
    main()
