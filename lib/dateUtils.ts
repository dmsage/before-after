export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDateDifference(
  date1: string,
  date2: string
): { days: number; weeks: number; months: number; formatted: string } {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  let formatted: string;

  if (days === 0) {
    formatted = 'Same day';
  } else if (days === 1) {
    formatted = '1 day apart';
  } else if (days < 7) {
    formatted = `${days} days apart`;
  } else if (weeks === 1) {
    formatted = '1 week apart';
  } else if (weeks < 4) {
    const remainingDays = days % 7;
    formatted =
      remainingDays > 0
        ? `${weeks} weeks, ${remainingDays} days apart`
        : `${weeks} weeks apart`;
  } else if (months === 1) {
    formatted = '1 month apart';
  } else if (months < 12) {
    const remainingWeeks = Math.floor((days - months * 30) / 7);
    formatted =
      remainingWeeks > 0
        ? `${months} months, ${remainingWeeks} weeks apart`
        : `${months} months apart`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    formatted =
      remainingMonths > 0
        ? `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} months apart`
        : `${years} ${years === 1 ? 'year' : 'years'} apart`;
  }

  return { days, weeks, months, formatted };
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function sortByDate<T extends { date: string }>(
  items: T[],
  order: 'newest' | 'oldest' = 'newest'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'newest' ? dateB - dateA : dateA - dateB;
  });
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function getRelativeTimeDescription(date1: string, date2: string): string {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();

  if (d1 === d2) return 'Same date';
  if (d1 < d2) return 'Earlier';
  return 'Later';
}
