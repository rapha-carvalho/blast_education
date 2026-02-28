/**
 * icsExporter.js
 * Generates an iCalendar (.ics) file from the study schedule.
 */

import { fixPtBrText } from "./ptBrText";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_START_HOUR = 19;
const DEFAULT_START_MINUTE = 0;

/** Format a Date as iCal UTC timestamp: 20260222T120000Z */
function toICSTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

/** Format a Date as local date-time string: YYYYMMDDTHHMMSS */
function toICSDateTime(date, hour = DEFAULT_START_HOUR, minute = DEFAULT_START_MINUTE) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

/** Fold long lines at 75 chars as per RFC 5545 */
function foldLine(line) {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) {
    chunks.push(` ${line.slice(i, i + 74)}`);
  }
  return chunks.join("\r\n");
}

/** Escape special chars for ICS text fields */
function escapeICS(value) {
  const str = String(value ?? "");
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function lessonIdOf(lesson) {
  if (!lesson || typeof lesson !== "object") return null;
  return typeof lesson.id === "string" && lesson.id.trim() ? lesson.id.trim() : null;
}

function lessonTitleOf(lesson, index) {
  if (lesson && typeof lesson === "object" && typeof lesson.title === "string" && lesson.title.trim()) {
    return fixPtBrText(lesson.title.trim());
  }
  return `Aula ${index + 1}`;
}

function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function buildClassLink(baseUrl, firstLessonId, fallbackPath) {
  if (!baseUrl) return "";
  if (firstLessonId) return `${baseUrl}/lesson/${encodeURIComponent(firstLessonId)}`;
  return `${baseUrl}${normalizePath(fallbackPath)}`;
}

function getBrazilVTimezoneBlock(timezone) {
  if (timezone !== BRAZIL_TIMEZONE) return [];
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${timezone}`,
    "X-LIC-LOCATION:America/Sao_Paulo",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
}

/**
 * Generate .ics file content from a schedule.
 *
 * @param {Array} sessions from generateSchedule().sessions
 * @param {string} courseTitle
 * @param {Object} options
 * @param {string} options.timezone
 * @param {number} options.startHour
 * @param {number} options.startMinute
 * @param {string} options.baseUrl current app origin
 * @param {string} options.fallbackClassPath fallback path if lesson ID is missing
 * @returns {string} raw ICS file content
 */
export function generateICS(
  sessions,
  courseTitle = "SQL do básico ao avançado",
  options = {}
) {
  const {
    timezone = BRAZIL_TIMEZONE,
    startHour = DEFAULT_START_HOUR,
    startMinute = DEFAULT_START_MINUTE,
    baseUrl = "",
    fallbackClassPath = "/",
  } = options;

  const normalizedBaseUrl = typeof baseUrl === "string" ? baseUrl.trim().replace(/\/+$/, "") : "";
  const now = toICSTimestamp(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Blast Education//Study Calendar//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(`${fixPtBrText(courseTitle)} - Cronograma`)}`,
    `X-WR-TIMEZONE:${timezone}`,
    ...getBrazilVTimezoneBlock(timezone),
  ];

  for (const session of sessions) {
    const { sessionIndex, date, module, lessons = [], durationMin = 0 } = session;
    const safeDurationMin = Number.isFinite(durationMin) ? Math.max(0, durationMin) : 0;

    const dtStart = toICSDateTime(date, startHour, startMinute);
    const endDate = new Date(date);
    endDate.setHours(startHour, startMinute, 0, 0);
    endDate.setMinutes(endDate.getMinutes() + safeDurationMin);
    const dtEnd = toICSDateTime(endDate, endDate.getHours(), endDate.getMinutes());

    const firstLesson = Array.isArray(lessons) ? lessons.find((lesson) => lessonIdOf(lesson)) : null;
    const classLink = buildClassLink(normalizedBaseUrl, lessonIdOf(firstLesson), fallbackClassPath);

    const lessonList = (Array.isArray(lessons) ? lessons : [])
      .map((lesson, index) => `${index + 1}. ${lessonTitleOf(lesson, index)}`)
      .join("\n");

    const moduleTitle = fixPtBrText(module?.title || "Sessao de estudos");
    const summary = `${moduleTitle} - Sessao ${sessionIndex + 1}`;

    const descriptionParts = [
      `Curso: ${fixPtBrText(courseTitle)}`,
      `Módulo: ${moduleTitle}`,
      "",
      "Horário padrão: 19:00 (GMT-3 - Brasil)",
      `Duracao estimada: ${safeDurationMin} min`,
    ];
    if (lessonList) {
      descriptionParts.push("", "Aulas da sessao:", lessonList);
    }
    if (classLink) {
      descriptionParts.push("", `Link da aula: ${classLink}`);
    }
    const description = descriptionParts.join("\n");

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:blast-sql-session-${sessionIndex + 1}-${date.getTime()}@blast.education`));
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART;TZID=${timezone}:${dtStart}`);
    lines.push(`DTEND;TZID=${timezone}:${dtEnd}`);
    lines.push(foldLine(`SUMMARY:${escapeICS(summary)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeICS(description)}`));
    if (classLink) {
      lines.push(foldLine(`URL:${escapeICS(classLink)}`));
    }
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push("TRIGGER:-PT30M");
    lines.push("DESCRIPTION:Sessao de estudos em 30 min");
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Trigger a browser download of the .ics file.
 *
 * @param {string} icsContent result of generateICS()
 * @param {string} filename
 */
export function downloadICS(icsContent, filename = "cronograma-sql.ics") {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
