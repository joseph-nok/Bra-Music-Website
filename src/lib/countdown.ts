export function getCountdownParts(targetDate: Date, now = new Date()) {
  const remainingMs = Math.max(targetDate.getTime() - now.getTime(), 0)
  const totalSeconds = Math.floor(remainingMs / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  return [
    [String(days), 'Days'],
    [String(hours).padStart(2, '0'), 'Hours'],
    [String(mins).padStart(2, '0'), 'Mins'],
    [String(secs).padStart(2, '0'), 'Secs'],
  ] as const
}
