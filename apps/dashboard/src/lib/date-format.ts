/** Format a date string to a short time (e.g. "2:30 PM") */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Format a date string to a short date (e.g. "Jan 5") */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
