/**
 * scheduleGenerator.js
 * Generates a study session schedule from course modules.
 *
 * Two modes:
 *  A) startDate only   → use daysPerWeek mask, 2 lessons/session
 *  B) startDate + endDate → fit all sessions within the date range,
 *     auto-calculate lessonsPerSession
 */

// Weekday index masks (0=Sun, 1=Mon … 6=Sat)
const DAY_MASKS = {
  3: [1, 3, 5], // Mon, Wed, Fri
  4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 4, 5], // Mon–Fri
};

const DAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Return the next date (>=from) whose weekday is in the mask */
function nextDayInMask(from, mask, skipFirst = false) {
  const d = new Date(from);
  if (skipFirst) d.setDate(d.getDate() + 1);
  for (let i = 0; i < 14; i++) {
    if (mask.includes(d.getDay())) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return new Date(from); // fallback
}

/** Collect all calendar dates between start and end that fall on mask days */
function collectAvailableDays(start, end, mask) {
  const days = [];
  const d = new Date(start);
  // align to first valid day
  while (!mask.includes(d.getDay()) && d <= end) {
    d.setDate(d.getDate() + 1);
  }
  while (d <= end) {
    if (mask.includes(d.getDay())) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * Flatten modules into an ordered lesson list.
 * Separates out the locked Master Challenge (module-11).
 */
function flattenLessons(modules) {
  const active = [];
  const locked = [];
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      const entry = { module: { id: mod.id, title: mod.title }, lesson };
      if (lesson.locked_until_all_previous_completed) {
        locked.push(entry);
      } else {
        active.push(entry);
      }
    }
  }
  return { active, locked };
}

/**
 * Group flat lesson list into sessions of `size` each.
 * Avoids splitting a module if only 1 lesson remains in it
 * (greedy: if current lesson is the last in its module, extend session by 1 only when possible).
 */
function groupIntoSessions(lessons, size) {
  const sessions = [];
  let i = 0;
  while (i < lessons.length) {
    const chunk = lessons.slice(i, i + size);
    sessions.push(chunk);
    i += size;
  }
  return sessions;
}

/**
 * Main export.
 *
 * @param {Array}  modules       — from courses.json
 * @param {Object} opts
 *   @param {Date}      opts.startDate
 *   @param {Date|null} opts.endDate    — null = use daysPerWeek
 *   @param {number}    opts.daysPerWeek — 3 | 4 | 5 (ignored when endDate set)
 * @returns {{ sessions, totalWeeks, avgSessionMin, warning }}
 */
export function generateSchedule(modules, { startDate, endDate = null, daysPerWeek = 3 }) {
  const { active, locked } = flattenLessons(modules);
  const allLessons = [...active, ...locked]; // locked goes last
  const totalLessons = allLessons.length;

  const mask = DAY_MASKS[daysPerWeek] ?? DAY_MASKS[3];
  let lessonsPerSession = 2;
  let warning = null;
  let availableDays = null;

  // ── Mode B: start + end ─────────────────────────────────────────────────
  if (endDate) {
    availableDays = collectAvailableDays(startDate, endDate, mask);
    const dayCount = availableDays.length;

    if (dayCount === 0) {
      warning = "Nenhum dia útil disponível neste período. Ajuste as datas.";
      return { sessions: [], totalWeeks: 0, avgSessionMin: 0, warning };
    }

    lessonsPerSession = Math.ceil(totalLessons / dayCount);

    if (lessonsPerSession > 4) {
      warning = `Prazo muito curto — seria necessário ${lessonsPerSession} aulas/sessão. Considere um prazo maior ou ritmo mais intenso.`;
      lessonsPerSession = 4; // cap so UI stays readable
    }
  }

  // ── Group lessons into sessions ──────────────────────────────────────────
  const sessionChunks = groupIntoSessions(allLessons, lessonsPerSession);

  // ── Assign dates ─────────────────────────────────────────────────────────
  const sessions = [];
  let cursor = new Date(startDate);

  for (let idx = 0; idx < sessionChunks.length; idx++) {
    const chunk = sessionChunks[idx];

    let date;
    if (availableDays) {
      // Mode B: use pre-collected days
      date = availableDays[idx] ?? availableDays[availableDays.length - 1];
    } else {
      // Mode A: walk forward picking valid weekdays
      date = idx === 0
        ? nextDayInMask(cursor, mask, false)
        : nextDayInMask(cursor, mask, true);
      cursor = new Date(date);
    }

    // Determine the primary module for this session (first lesson's module)
    const primaryModule = chunk[0].module;
    const lessons = chunk.map((c) => c.lesson);
    const durationMin = lessons.length * 40;

    // Week number (1-indexed, relative to start)
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((date - startDate) / msPerDay);
    const weekNum = Math.floor(diffDays / 7) + 1;

    sessions.push({
      sessionIndex: idx,
      weekNum,
      date: new Date(date),
      dayLabel: DAY_LABELS_PT[date.getDay()],
      module: primaryModule,
      lessons,
      durationMin,
    });
  }

  const totalWeeks = sessions.length > 0
    ? sessions[sessions.length - 1].weekNum
    : 0;

  const avgSessionMin = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + x.durationMin, 0) / sessions.length)
    : 0;

  return { sessions, totalWeeks, avgSessionMin, warning };
}

/** Helper: get next Monday from today */
export function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay(); // 0=Sun
  const diff = day === 1 ? 7 : (1 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Helper: format Date as YYYY-MM-DD for <input type="date"> */
export function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}
