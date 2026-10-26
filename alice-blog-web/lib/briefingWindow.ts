export const briefingWindowDays = 90;
export const briefingCarouselDays = 7;

export function beijingCalendarDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replaceAll('-', '.');
}

function calendarDay(value: string): number {
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(value)) throw new Error('选刊日期格式不正确');
  const iso = value.replaceAll('.', '-');
  const time = Date.parse(iso + 'T00:00:00Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== iso) throw new Error('选刊日期无效');
  return time / 86400000;
}

// Calendar windows include today; missing editions never pull in older dates.
export function getBriefingWindow<T extends { edition: { date: string } }>(issues: T[], asOfDate: string, days = briefingWindowDays): T[] {
  if (!Number.isInteger(days) || days < 1 || days > briefingWindowDays) throw new Error('选刊窗口范围无效');
  const end = calendarDay(asOfDate);
  const byDate = new Map<string, T>();
  for (const issue of issues) {
    const age = end - calendarDay(issue.edition.date);
    if (age >= 0 && age < days && !byDate.has(issue.edition.date)) byDate.set(issue.edition.date, issue);
  }
  return [...byDate.values()].sort((a, b) => b.edition.date.localeCompare(a.edition.date));
}

export function stepBriefingDate(dates: string[], current: string, direction: 1 | -1): string | undefined {
  if (!dates.length) return undefined;
  const index = dates.indexOf(current);
  return dates[index < 0 ? 0 : (index + direction + dates.length) % dates.length];
}
