// metra-widget.js - paste into Scriptable and add as a widget.

// Replace this with your GitHub Pages URL after publishing docs/schedule.json.
const DATA_URL = "https://example.com/metra-schedule/schedule.json";
const CACHE_FILE = "metra-schedule.json";
const CACHE_MAX_AGE_HOURS = 24 * 7;
const DEFAULT_PARAM = "KENILWORTH:inbound";

const param = args.widgetParameter || DEFAULT_PARAM;
const [stopId, direction = "inbound"] = param.split(":");

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

function buildWidget(schedule, departures, stopId, direction) {
  const stop = schedule.stops?.[stopId];
  const stopName = stop?.name || stopId;
  const line = stop?.line || "Metra";
  const pattern = servicePatternForToday(schedule.exceptions);

  const widget = new ListWidget();
  widget.setPadding(12, 14, 12, 14);
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

  const header = widget.addText(`${stopName.toUpperCase()} ${direction.toUpperCase()}`);
  header.font = Font.boldSystemFont(11);
  header.textColor = Color.gray();
  header.lineLimit = 1;

  widget.addSpacer(8);

  if (departures.length === 0) {
    const empty = widget.addText("No more trains today");
    empty.font = Font.systemFont(14);
    empty.textColor = Color.white();
    widget.addSpacer();
  } else {
    for (const [index, departure] of departures.entries()) {
      const row = widget.addStack();
      row.centerAlignContent();

      const timeText = row.addText(departure.time);
      timeText.font = Font.boldMonospacedSystemFont(index === 0 ? 20 : 18);
      timeText.textColor = index === 0 ? new Color("#5EC2FF") : Color.white();

      row.addSpacer();

      const relText = row.addText(relativeText(departure));
      relText.font = Font.systemFont(13);
      relText.textColor = Color.gray();

      widget.addSpacer(5);
    }
  }

  const footer = widget.addText(`${line} · ${pattern}`);
  footer.font = Font.systemFont(10);
  footer.textColor = Color.gray();
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
    widget.setPadding(12, 14, 12, 14);
    const text = widget.addText("Unable to load Metra schedule");
    text.font = Font.systemFont(13);
    text.textColor = Color.white();

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentSmall();
    }
  }

  Script.complete();
}

await main();
