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
2. Preview it in Scriptable with the fixture data. While `DATA_URL` still points at `example.com`, the script uses its embedded fixture data automatically.
3. Publish `docs/schedule.json` with GitHub Pages from the `main` branch and `/docs` folder.
4. Replace the fixture with generated data from `build.py`.

## GitHub Pages

After pushing this repo to GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Set source to `Deploy from a branch`.
4. Set branch to `main` and folder to `/docs`.
5. Replace `DATA_URL` in `scriptable/metra-widget.js` with:

```text
https://YOUR_USER.github.io/YOUR_REPO/schedule.json
```
