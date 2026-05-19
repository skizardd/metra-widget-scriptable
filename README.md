# Metra Scriptable Widget

A personal Scriptable widget for showing upcoming Metra departures from a configured station and direction.

The first version uses a small hand-authored `docs/schedule.json` fixture so the widget can be tested before the GTFS preprocessor exists. Once the widget shape feels right, `build.py` will generate the same JSON schema from Metra GTFS static schedule data.

GitHub repo: <https://github.com/skizardd/metra-widget-scriptable>

Published schedule fixture: <https://skizardd.github.io/metra-widget-scriptable/schedule.json>

UP-N OTC outbound companion data: <https://skizardd.github.io/metra-widget-scriptable/up-n-otc-outbound.json>

Large widget commute data: <https://skizardd.github.io/metra-widget-scriptable/up-n-kenilworth-otc-large.json>

## Repository Layout

```text
.
├── build.py
├── docs/
│   └── schedule.json
├── scripts/
│   └── build_large_widget_schedule.py
└── scriptable/
    ├── metra-widget.js
    └── metra-large-widget.js
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

The large Scriptable widget reads from `https://skizardd.github.io/metra-widget-scriptable/up-n-kenilworth-otc-large.json?v=large-layout-2`.

Regenerate the large-widget commute JSON after refreshing `schedule.zip`:

```text
python scripts/build_large_widget_schedule.py
```

## Large Widget Colors

Set the large widget parameter to one of these theme names:

```text
midnight
lakeshore
signal
ember
daylight
rose
```

The same values also work as `theme=midnight`, `theme=lakeshore`, etc.

Standalone themed scripts are also generated for direct use in Scriptable:

```text
metra-small-midnight.js
metra-small-lakeshore.js
metra-small-signal.js
metra-small-ember.js
metra-small-daylight.js
metra-small-rose.js
metra-large-midnight.js
metra-large-lakeshore.js
metra-large-signal.js
metra-large-ember.js
metra-large-daylight.js
metra-large-rose.js
```

Regenerate them after changing either generic widget script:

```text
powershell -ExecutionPolicy Bypass -File scripts/build_themed_widget_scripts.ps1
```

| Theme | Background | Primary Text | Secondary Text | Accent |
| --- | --- | --- | --- | --- |
| `midnight` | `#111318` | `#F4F7FB` | `#9AA4B2` | `#5EC2FF` |
| `lakeshore` | `#081B22` | `#EAF8FA` | `#8FB7C0` | `#42D6CA` |
| `signal` | `#10170F` | `#F1F8EA` | `#A3B99A` | `#8FD14F` |
| `ember` | `#1A1214` | `#FFF3F0` | `#C7A3A8` | `#FF7A59` |
| `daylight` | `#F7FAFC` | `#17212B` | `#667581` | `#0B75D1` |
| `rose` | `#2A111F` | `#FFF1F7` | `#D8A8BE` | `#FF8CC6` |

Color roles:

- Background fills the widget.
- Primary text is used for standard departure and arrival times.
- Secondary text is used for headers, service pattern, train numbers, relative times, footer, and the muted `to`.
- Accent is used for the next train in each schedule and error title text.
