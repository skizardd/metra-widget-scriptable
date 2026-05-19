# Metra Scriptable Widget

A personal Scriptable widget for showing upcoming Metra departures from a configured station and direction.

The first version uses a small hand-authored `docs/schedule.json` fixture so the widget can be tested before the GTFS preprocessor exists. Once the widget shape feels right, `build.py` will generate the same JSON schema from Metra GTFS static schedule data.

GitHub repo: <https://github.com/skizardd/metra-widget-scriptable>

Published schedule fixture: <https://skizardd.github.io/metra-widget-scriptable/schedule.json>

## Repository Layout

```text
.
├── build.py
├── docs/
│   └── schedule.json
└── scriptable/
    └── metra-widget.js
```

## Widget Parameter

Scriptable widgets should use:

```text
STOP_ID:direction
```

Examples:

```text
KENILWORTH:inbound
KENILWORTH:outbound
```

## Next Steps

1. Copy `scriptable/metra-widget.js` into Scriptable.
2. Preview it in Scriptable with the fixture data. While `DATA_URL` still points at `example.com`, the script uses its embedded fixture data automatically.
3. Publish `docs/schedule.json` with GitHub Pages from the `main` branch and `/docs` folder.
4. Replace the fixture with generated data from `build.py`.

## GitHub Pages

This repo is configured for GitHub Pages from the `main` branch and `/docs` folder.

The Scriptable widget reads from `https://skizardd.github.io/metra-widget-scriptable/schedule.json`.
