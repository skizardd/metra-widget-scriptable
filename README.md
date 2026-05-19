# Metra Scriptable Widget

A personal Scriptable widget for showing upcoming Metra departures from a configured station and direction.

The first version uses a small hand-authored `docs/schedule.json` fixture so the widget can be tested before the GTFS preprocessor exists. Once the widget shape feels right, `build.py` will generate the same JSON schema from Metra GTFS static schedule data.

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
2. Preview it in Scriptable with the fixture data.
3. Publish `docs/schedule.json` with GitHub Pages.
4. Replace the fixture with generated data from `build.py`.
