import { TIMEZONE } from './constants';

export function parsePKT(dateStr: string) {
  if (!dateStr) return new Date('invalid');

  const dmyRegex = /^(\d{2})-(\d{2})-(\d{4})(.*)$/;
  const match = dateStr.match(dmyRegex);
  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    const rest = match[4] || 'T00:00:00';
    dateStr = `${year}-${month}-${day}${rest.includes('T') ? rest : 'T' + rest.trim()}`;
  }

  if (!dateStr.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
    return new Date(dateStr + '+05:00');
  }
  return new Date(dateStr);
}

export function getPKTToday() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value);
  const day = parseInt(parts.find((p) => p.type === 'day')!.value);
  const iso = `${year}-${pad(month)}-${pad(day)}`;
  const midnight = new Date(`${iso}T00:00:00+05:00`);
  return { year, month, day, iso, midnight };
}

export function getPKTDateOffset(midnight: Date, offsetDays: number) {
  const d = new Date(midnight.getTime() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).formatToParts(d);
  return {
    iso: `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`,
    weekday: parts.find((p) => p.type === 'weekday')!.value,
  };
}

export function isSunday(dateStr: string) {
  const date = parsePKT(dateStr);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: TIMEZONE });
  return weekday === 'Sunday';
}

export function formatPKTDateTime(date: Date) {
  return date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
