// metra-large-widget.js - paste into Scriptable and use with a large widget.

const DATA_URL = "https://skizardd.github.io/metra-widget-scriptable/up-n-kenilworth-otc-large.json?v=60b5df7";
const CACHE_FILE = "metra-large-widget-schedule.json";
const CACHE_MAX_AGE_HOURS = 24 * 7;

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

function addHeader(widget, schedule, pattern) {
  const row = widget.addStack();
  row.centerAlignContent();

  const title = row.addText("UP-N COMMUTE");
  title.font = Font.boldSystemFont(12);
  title.textColor = Color.gray();
  title.lineLimit = 1;

  row.addSpacer();

  const service = row.addText(pattern.toUpperCase());
  service.font = Font.systemFont(11);
  service.textColor = Color.gray();
  service.lineLimit = 1;

  widget.addSpacer(8);
}

function addSection(widget, leg, trips, nowMinutes) {
  const title = widget.addText(leg.short_label);
  title.font = Font.boldSystemFont(12);
  title.textColor = Color.gray();
  title.lineLimit = 1;

  widget.addSpacer(3);

  if (trips.length === 0) {
    const empty = widget.addText("No more trains today");
    empty.font = Font.systemFont(12);
    empty.textColor = Color.gray();
    widget.addSpacer(6);
    return;
  }

  for (const [index, trip] of trips.entries()) {
    const row = widget.addStack();
    row.centerAlignContent();

    const train = row.addText(`#${trip.train}`);
    train.font = Font.monospacedSystemFont(index === 0 ? 12 : 11);
    train.textColor = index === 0 ? new Color("#5EC2FF") : Color.gray();
    train.lineLimit = 1;

    row.addSpacer(8);

    const times = row.addText(`${formatTime(trip.depart_minutes)} to ${formatTime(trip.arrive_minutes)}`);
    times.font = Font.boldMonospacedSystemFont(index === 0 ? 13 : 12);
    times.textColor = index === 0 ? new Color("#5EC2FF") : Color.white();
    times.lineLimit = 1;

    row.addSpacer();

    const relative = row.addText(relativeText(trip, nowMinutes));
    relative.font = Font.systemFont(index === 0 ? 12 : 11);
    relative.textColor = Color.gray();
    relative.lineLimit = 1;

    widget.addSpacer(3);
  }

  widget.addSpacer(6);
}

function addFooter(widget, schedule) {
  widget.addSpacer();
  const updated = schedule.generated_at.slice(0, 10);
  const footer = widget.addText(`${schedule.route.id} schedule - ${updated}`);
  footer.font = Font.systemFont(10);
  footer.textColor = Color.gray();
  footer.lineLimit = 1;
}

function buildWidget(schedule) {
  const now = new Date();
  const pattern = activeServicePattern(schedule, now);
  const nowMinutes = logicalNowMinutes(now);
  const rowsPerSection = schedule.widget?.rows_per_section || 5;

  const widget = new ListWidget();
  widget.setPadding(14, 14, 12, 14);
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

  addHeader(widget, schedule, pattern);

  for (const key of schedule.widget.sections) {
    const leg = schedule.legs[key];
    const trips = upcomingTrips(leg, pattern, nowMinutes, rowsPerSection);
    addSection(widget, leg, trips, nowMinutes);
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
    widget.setPadding(14, 14, 12, 14);
    const text = widget.addText("Unable to load Metra schedule");
    text.font = Font.systemFont(13);
    text.textColor = Color.white();

    if (config.runsInWidget) {
      Script.setWidget(widget);
    } else {
      await widget.presentLarge();
    }
  }

  Script.complete();
}

await main();
