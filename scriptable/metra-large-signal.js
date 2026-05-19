// metra-large-signal.js - paste into Scriptable and use with a large widget.

const DATA_URL = "https://skizardd.github.io/metra-widget-scriptable/up-n-kenilworth-otc-large.json?v=large-layout-2";
const CACHE_FILE = "metra-large-widget-schedule-v2.json";
const CACHE_MAX_AGE_HOURS = 24 * 7;
const FIXED_THEME = "signal";
const THEMES = {
  midnight: {
    background: "#111318",
    primary: "#F4F7FB",
    secondary: "#9AA4B2",
    accent: "#5EC2FF",
  },
  lakeshore: {
    background: "#081B22",
    primary: "#EAF8FA",
    secondary: "#8FB7C0",
    accent: "#42D6CA",
  },
  signal: {
    background: "#10170F",
    primary: "#F1F8EA",
    secondary: "#A3B99A",
    accent: "#8FD14F",
  },
  ember: {
    background: "#1A1214",
    primary: "#FFF3F0",
    secondary: "#C7A3A8",
    accent: "#FF7A59",
  },
  daylight: {
    background: "#F7FAFC",
    primary: "#17212B",
    secondary: "#667581",
    accent: "#0B75D1",
  },
  rose: {
    background: "#2A111F",
    primary: "#FFF1F7",
    secondary: "#D8A8BE",
    accent: "#FF8CC6",
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

function servicePatternForDate(exceptions, date) {
  const isoDate = localIsoDate(date);
  if (exceptions && exceptions[isoDate]) return exceptions[isoDate];

  const dow = date.getDay();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function activeServicePattern(schedule, now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < 180) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return servicePatternForDate(schedule.exceptions, yesterday);
  }
  return servicePatternForDate(schedule.exceptions, now);
}

function logicalNowMinutes(now) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes < 180 ? 1440 + minutes : minutes;
}

function formatTime(totalMinutes) {
  const dayMinutes = totalMinutes % 1440;
  const hours24 = Math.floor(dayMinutes / 60);
  const minutes = dayMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function relativeText(trip, nowMinutes) {
  const minutesUntil = Math.max(0, trip.depart_minutes - nowMinutes);
  if (minutesUntil < 60) return `in ${minutesUntil}m`;

  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;
  return minutes === 0 ? `in ${hours}h` : `in ${hours}h ${minutes}m`;
}

function upcomingTrips(leg, pattern, nowMinutes, limit) {
  return (leg.departures[pattern] || [])
    .filter((trip) => trip.depart_minutes >= nowMinutes)
    .slice(0, limit);
}

function applyBaseStyle(widget) {
  widget.backgroundColor = BACKGROUND;
  widget.setPadding(12, 12, 10, 12);
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
}

function addHeader(widget, schedule, pattern) {
  const row = widget.addStack();
  row.centerAlignContent();

  const title = row.addText("UP-N COMMUTE");
  title.font = Font.boldSystemFont(13);
  title.textColor = SECONDARY_TEXT;
  title.lineLimit = 1;

  row.addSpacer();

  const service = row.addText(pattern.toUpperCase());
  service.font = Font.systemFont(12);
  service.textColor = SECONDARY_TEXT;
  service.lineLimit = 1;

  widget.addSpacer(9);
}

function addSection(widget, leg, trips, nowMinutes) {
  const title = widget.addText(leg.short_label);
  title.font = Font.boldSystemFont(13);
  title.textColor = SECONDARY_TEXT;
  title.lineLimit = 1;

  widget.addSpacer(4);

  if (trips.length === 0) {
    const empty = widget.addText("No more trains today");
    empty.font = Font.systemFont(12);
    empty.textColor = SECONDARY_TEXT;
    widget.addSpacer(6);
    return;
  }

  for (const [index, trip] of trips.entries()) {
    const row = widget.addStack();
    row.centerAlignContent();

    const train = row.addText(`#${trip.train}`);
    train.font = Font.systemFont(index === 0 ? 13 : 12);
    train.textColor = index === 0 ? ACCENT : SECONDARY_TEXT;
    train.lineLimit = 1;

    row.addSpacer(7);

    const depart = row.addText(formatTime(trip.depart_minutes));
    depart.font = Font.boldMonospacedSystemFont(index === 0 ? 15 : 14);
    depart.textColor = index === 0 ? ACCENT : PRIMARY_TEXT;
    depart.lineLimit = 1;

    row.addSpacer(4);

    const to = row.addText("to");
    to.font = Font.systemFont(index === 0 ? 11 : 10);
    to.textColor = SECONDARY_TEXT;
    to.lineLimit = 1;

    row.addSpacer(4);

    const arrive = row.addText(formatTime(trip.arrive_minutes));
    arrive.font = Font.boldMonospacedSystemFont(index === 0 ? 15 : 14);
    arrive.textColor = index === 0 ? ACCENT : PRIMARY_TEXT;
    arrive.lineLimit = 1;

    row.addSpacer();

    const relative = row.addText(relativeText(trip, nowMinutes));
    relative.font = Font.systemFont(index === 0 ? 12 : 11);
    relative.textColor = SECONDARY_TEXT;
    relative.lineLimit = 1;

    widget.addSpacer(4);
  }
}

function addFooter(widget, schedule) {
  widget.addSpacer();
  const updated = schedule.generated_at.slice(0, 10);
  const footer = widget.addText(`${schedule.route.id} schedule - ${updated}`);
  footer.font = Font.systemFont(10);
  footer.textColor = SECONDARY_TEXT;
  footer.lineLimit = 1;
}

function buildWidget(schedule) {
  const now = new Date();
  const pattern = activeServicePattern(schedule, now);
  const nowMinutes = logicalNowMinutes(now);
  const widgetConfig = schedule.widget || {};
  const rowsPerSection = widgetConfig.rows_per_section || 6;
  const sections = widgetConfig.sections || ["kenilworth_inbound", "otc_outbound"];

  const widget = new ListWidget();
  applyBaseStyle(widget);

  addHeader(widget, schedule, pattern);

  for (let index = 0; index < sections.length; index++) {
    const key = sections[index];
    const leg = schedule.legs[key];
    const trips = upcomingTrips(leg, pattern, nowMinutes, rowsPerSection);
    addSection(widget, leg, trips, nowMinutes);
    if (index < sections.length - 1) {
      widget.addSpacer(12);
    }
  }

  addFooter(widget, schedule);
  return widget;
}

async function main() {
  try {
    const schedule = await loadSchedule();
    const widget = buildWidget(schedule);

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentLarge();
    }
  } catch (err) {
    const widget = new ListWidget();
    applyBaseStyle(widget);

    const title = widget.addText("Metra widget error");
    title.font = Font.boldSystemFont(14);
    title.textColor = ACCENT;

    widget.addSpacer(6);

    const text = widget.addText(String(err && err.message ? err.message : err));
    text.font = Font.systemFont(11);
    text.textColor = PRIMARY_TEXT;
    text.lineLimit = 6;

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentLarge();
    }
  }

  Script.complete();
}

await main();
