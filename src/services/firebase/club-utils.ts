export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const normalizePhone = (value: string): string =>
  value.replace(/\s+/g, '').replace(/[()\-]/g, '').trim();

export const normalizeClubName = (value?: string): string => {
  const base = (value || '').trim();
  if (!base) return '';

  return base
    .split(/\s+/)
    .map((word) => (word.length > 2 ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word.toUpperCase()))
    .join(' ');
};

export const normalizeGuestType = (value: string): 'rotarian' | 'rotaractor' | 'non_rotaractor' => {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'rotarian') return 'rotarian';
  if (normalized === 'rotaractor') return 'rotaractor';
  return 'non_rotaractor';
};
