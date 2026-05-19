// metra-small-otc-outbound-midnight.js - paste into Scriptable and add as a small widget.

const DATA_URL = "https://skizardd.github.io/metra-widget-scriptable/up-n-otc-outbound.json?v=otc-small-1";
const CACHE_FILE = "metra-small-otc-outbound-schedule.json";
const CACHE_MAX_AGE_HOURS = 24 * 7;
const FIXED_THEME = "midnight";
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
const THEME_NAME = FIXED_THEME || themeNameFromParameter(args.widgetParameter);
const THEME = THEMES[THEME_NAME] || THEMES.midnight;
const BACKGROUND = new Color(THEME.background);
const PRIMARY_TEXT = new Color(THEME.primary);
const SECONDARY_TEXT = new Color(THEME.secondary);
const ACCENT = new Color(THEME.accent);

function themeNameFromParameter(parameter) {
  const raw = String(parameter || "midnight").trim().toLowerCase();
  if (!raw) return "midnight";

  const parts = raw.split(/[;,\s]+/);
  for (const part of parts) {
    if (THEMES[part]) return part;
    if (part.indexOf("theme=") === 0) {
      return part.slice("theme=".length);
    }
  }

  return raw;
}

async function loadSchedule() {
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

function servicePatternForToday(schedule, date) {
  const isoDate = localIsoDate(date);
  if (schedule.exceptions && schedule.exceptions[isoDate]) return schedule.exceptions[isoDate];

  const dow = date.getDay();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function toMinutes(time) {
  const parts = time.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function logicalNowMinutes(now) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes < 180 ? 1440 + minutes : minutes;
}

function normalizeDeparture(row) {
  const minutes = toMinutes(row.time);
  return {
    train: row.train,
    time: row.time,
    minutes: minutes < 180 ? minutes + 1440 : minutes,
    headsign: row.headsign,
  };
}

function nextDepartures(schedule, limit) {
  const now = new Date();
  const pattern = servicePatternForToday(schedule, now);
  const nowMinutes = logicalNowMinutes(now);
  const times = schedule.departures[pattern] || [];

  return times
    .map(normalizeDeparture)
    .filter((departure) => departure.minutes >= nowMinutes)
    .slice(0, limit);
}

function formatTime(totalMinutes) {
  const dayMinutes = totalMinutes % 1440;
  const hours24 = Math.floor(dayMinutes / 60);
  const minutes = dayMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function relativeText(departure) {
  const minutesUntil = Math.max(0, departure.minutes - logicalNowMinutes(new Date()));
  return `in ${minutesUntil}m`;
}

function buildWidget(schedule, departures) {
  const pattern = servicePatternForToday(schedule, new Date());
  const widget = new ListWidget();
  widget.backgroundColor = BACKGROUND;
  widget.setPadding(12, 14, 12, 14);
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

  const header = widget.addText("CHICAGO OTC OUTBOUND");
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

      const train = row.addText(`#${departure.train}`);
      train.font = Font.systemFont(index === 0 ? 12 : 11);
      train.textColor = index === 0 ? ACCENT : SECONDARY_TEXT;
      train.lineLimit = 1;

      row.addSpacer(6);

      const time = row.addText(formatTime(departure.minutes));
      time.font = Font.boldMonospacedSystemFont(index === 0 ? 17 : 15);
      time.textColor = index === 0 ? ACCENT : PRIMARY_TEXT;
      time.lineLimit = 1;

      row.addSpacer();

      const rel = row.addText(relativeText(departure));
      rel.font = Font.systemFont(12);
      rel.textColor = SECONDARY_TEXT;
      rel.lineLimit = 1;

      widget.addSpacer(4);
    }
  }

  const footer = widget.addText(`${schedule.route.id} · ${pattern}`);
  footer.font = Font.systemFont(10);
  footer.textColor = SECONDARY_TEXT;
  footer.lineLimit = 1;

  return widget;
}

async function main() {
  try {
    const schedule = await loadSchedule();
    const departures = nextDepartures(schedule, 3);
    const widget = buildWidget(schedule, departures);

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  } catch (err) {
    const widget = new ListWidget();
    widget.backgroundColor = BACKGROUND;
    widget.setPadding(12, 14, 12, 14);
    const text = widget.addText(String(err && err.message ? err.message : err));
    text.font = Font.systemFont(12);
    text.textColor = PRIMARY_TEXT;
    text.lineLimit = 6;

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  }

  Script.complete();
}

await main();
