// metra-widget.js - paste into Scriptable and add as a widget.

const DATA_URL = "https://skizardd.github.io/metra-widget-scriptable/schedule.json";
const CACHE_FILE = "metra-schedule.json";
const CACHE_MAX_AGE_HOURS = 24 * 7;
const DEFAULT_PARAM = "KENILWORTH:inbound";
const FIXED_THEME = null;
const THEMES = {
  midnight: {
    background: "#111318",
    primary: "#F4F7FB",
    secondary: "#9AA4B2",
    accent: "#5EC2FF",
  },
  "midnight-light": {
    background: "#F3F6FA",
    primary: "#18212C",
    secondary: "#687789",
    accent: "#2878C8",
  },
  lakeshore: {
    background: "#081B22",
    primary: "#EAF8FA",
    secondary: "#8FB7C0",
    accent: "#42D6CA",
  },
  "lakeshore-light": {
    background: "#EAF8F8",
    primary: "#12343A",
    secondary: "#5E858B",
    accent: "#008C96",
  },
  signal: {
    background: "#10170F",
    primary: "#F1F8EA",
    secondary: "#A3B99A",
    accent: "#8FD14F",
  },
  "signal-light": {
    background: "#F1F8E8",
    primary: "#1F321C",
    secondary: "#6F8767",
    accent: "#4F9D2F",
  },
  ember: {
    background: "#1A1214",
    primary: "#FFF3F0",
    secondary: "#C7A3A8",
    accent: "#FF7A59",
  },
  "ember-light": {
    background: "#FFF0EB",
    primary: "#3A1D1A",
    secondary: "#946B63",
    accent: "#D94E2B",
  },
  daylight: {
    background: "#F7FAFC",
    primary: "#17212B",
    secondary: "#667581",
    accent: "#0B75D1",
  },
  "daylight-light": {
    background: "#FFFFFF",
    primary: "#102033",
    secondary: "#637184",
    accent: "#006BD6",
  },
  rose: {
    background: "#2A111F",
    primary: "#FFF1F7",
    secondary: "#D8A8BE",
    accent: "#FF8CC6",
  },
  "rose-light": {
    background: "#FFF0F8",
    primary: "#3B1830",
    secondary: "#9A6482",
    accent: "#D9368B",
  },
};

const PREVIEW_SCHEDULE = {
  version: "fixture-2026-05-19",
  generated_at: "2026-05-19T20:00:00Z",
  stops: {
    KENILWORTH: { name: "Kenilworth", line: "UP-N" },
    OTC: { name: "Ogilvie Transportation Center", line: "UP-N" },
  },
  departures: {
    KENILWORTH: {
      inbound: {
        weekday: ["05:14", "05:42", "06:08", "06:32", "07:02", "07:31", "08:03", "08:35", "09:10", "16:42", "17:12", "17:42", "18:12", "18:42", "19:42", "20:42", "21:42", "22:42"],
        saturday: ["06:18", "07:18", "08:18", "09:18", "10:18", "11:18", "12:18", "13:18", "14:18", "15:18", "16:18", "17:18", "18:18", "19:18", "20:18", "21:18", "22:18"],
        sunday: ["06:48", "07:48", "08:48", "09:48", "10:48", "11:48", "12:48", "13:48", "14:48", "15:48", "16:48", "17:48", "18:48", "19:48", "20:48", "21:48"],
      },
      outbound: {
        weekday: ["05:55", "06:25", "06:55", "07:25", "07:55", "08:25", "08:55", "16:05", "16:35", "17:05", "17:35", "18:05", "18:35", "19:05", "19:35", "20:35", "21:35", "22:35", "23:35"],
        saturday: ["06:35", "07:35", "08:35", "09:35", "10:35", "11:35", "12:35", "13:35", "14:35", "15:35", "16:35", "17:35", "18:35", "19:35", "20:35", "21:35", "22:35"],
        sunday: ["07:05", "08:05", "09:05", "10:05", "11:05", "12:05", "13:05", "14:05", "15:05", "16:05", "17:05", "18:05", "19:05", "20:05", "21:05"],
      },
    },
  },
  exceptions: {
    "2026-05-25": "sunday",
    "2026-07-04": "sunday",
    "2026-11-26": "sunday",
  },
};

const WIDGET_OPTIONS = widgetOptionsFromParameter(args.widgetParameter);
const THEME = THEMES[WIDGET_OPTIONS.theme] || THEMES.midnight;
const BACKGROUND = new Color(THEME.background);
const PRIMARY_TEXT = new Color(THEME.primary);
const SECONDARY_TEXT = new Color(THEME.secondary);
const ACCENT = new Color(THEME.accent);
const [stopId, direction = "inbound"] = WIDGET_OPTIONS.route.split(":");

function widgetOptionsFromParameter(parameter) {
  const options = {
    route: DEFAULT_PARAM,
    theme: FIXED_THEME || "midnight",
  };
  const raw = String(parameter || "").trim();
  if (!raw) return options;

  const parts = raw.split(/[;,\s]+/);
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower.indexOf("theme=") === 0 && !FIXED_THEME) {
      options.theme = lower.slice("theme=".length);
    } else if (THEMES[lower] && !FIXED_THEME) {
      options.theme = lower;
    } else if (part.indexOf(":") > 0) {
      options.route = part;
    }
  }

  return options;
}

async function loadSchedule() {
  if (DATA_URL.includes("example.com")) {
    return PREVIEW_SCHEDULE;
  }

  const fm = FileManager.local();
  const path = fm.joinPath(fm.cacheDirectory(), CACHE_FILE);

  if (fm.fileExists(path)) {
    const ageMs = Date.now() - fm.modificationDate(path).getTime();
    if (ageMs < CACHE_MAX_AGE_HOURS * 3600 * 1000) {
      return JSON.parse(fm.readString(path));
    }
  }

  try {
    const req = new Request(DATA_URL);
    req.timeoutInterval = 10;
    const data = await req.loadJSON();
    fm.writeString(path, JSON.stringify(data));
    return data;
  } catch (err) {
    if (fm.fileExists(path)) {
      return JSON.parse(fm.readString(path));
    }
    throw err;
  }
}

function localIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function servicePatternForToday(exceptions, date = new Date()) {
  const isoDate = localIsoDate(date);
  if (exceptions && exceptions[isoDate]) return exceptions[isoDate];

  const dow = date.getDay();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function nextDepartures(schedule, stopId, direction, limit) {
  const pattern = servicePatternForToday(schedule.exceptions);
  const times = schedule.departures?.[stopId]?.[direction]?.[pattern] || [];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return times
    .map((time) => ({ time, minutes: toMinutes(time) }))
    .filter((departure) => departure.minutes >= nowMinutes)
    .slice(0, limit);
}

function relativeText(departure) {
  const now = new Date();
  const minutesUntil = Math.max(0, departure.minutes - (now.getHours() * 60 + now.getMinutes()));
  return `in ${minutesUntil}m`;
}

function displayTime(departure) {
  const hours24 = Math.floor(departure.minutes / 60);
  const minutes = departure.minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function buildWidget(schedule, departures, stopId, direction) {
  const stop = schedule.stops?.[stopId];
  const stopName = stop?.name || stopId;
  const line = stop?.line || "Metra";
  const pattern = servicePatternForToday(schedule.exceptions);

  const widget = new ListWidget();
  widget.backgroundColor = BACKGROUND;
  widget.setPadding(12, 14, 12, 14);
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

  const header = widget.addText(`${stopName.toUpperCase()} ${direction.toUpperCase()}`);
  header.font = Font.boldSystemFont(11);
  header.textColor = SECONDARY_TEXT;
  header.lineLimit = 1;

  widget.addSpacer(8);

  if (departures.length === 0) {
    const empty = widget.addText("No more trains today");
    empty.font = Font.systemFont(14);
    empty.textColor = PRIMARY_TEXT;
    widget.addSpacer();
  } else {
    for (const [index, departure] of departures.entries()) {
      const row = widget.addStack();
      row.centerAlignContent();

      const timeText = row.addText(displayTime(departure));
      timeText.font = Font.boldMonospacedSystemFont(index === 0 ? 18 : 16);
      timeText.textColor = index === 0 ? ACCENT : PRIMARY_TEXT;
      timeText.lineLimit = 1;

      row.addSpacer();

      const relText = row.addText(relativeText(departure));
      relText.font = Font.systemFont(13);
      relText.textColor = SECONDARY_TEXT;

      widget.addSpacer(5);
    }
  }

  const footer = widget.addText(`${line} · ${pattern}`);
  footer.font = Font.systemFont(10);
  footer.textColor = SECONDARY_TEXT;
  footer.lineLimit = 1;

  return widget;
}

async function main() {
  try {
    const schedule = await loadSchedule();
    const departures = nextDepartures(schedule, stopId, direction, 3);
    const widget = buildWidget(schedule, departures, stopId, direction);

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  } catch (err) {
    const widget = new ListWidget();
    widget.backgroundColor = BACKGROUND;
    widget.setPadding(12, 14, 12, 14);
    const text = widget.addText("Unable to load Metra schedule");
    text.font = Font.systemFont(13);
    text.textColor = PRIMARY_TEXT;

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  }

  Script.complete();
}

await main();
