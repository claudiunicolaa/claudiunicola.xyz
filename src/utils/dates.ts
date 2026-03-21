export function formatDateHuman(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0];
}
