export function formatCardCount(count: number): string {
  return count === 1 ? '1 card' : `${count} cards`
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoString
  }
}
