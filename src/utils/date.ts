export const daysToMilliseconds = (days: number) => days * 24 * 60 * 60 * 1000

export const addHours = (date: Date, hours: number) => {
  date.setHours(date.getHours() + hours)
}

export const addDays = (date: Date, days: number) => {
  date.setDate(date.getDate() + days)
}

export const addYears = (date: Date, years: number) => {
  date.setFullYear(date.getFullYear() + years)
}

export const addYearsClone = (date: Date, years: number) => {
  const clone = structuredClone(date)
  addYears(clone, years)
  return clone
}

export const setToStartOfDay = (date: Date) => {
  date.setHours(0, 0, 0, 0)
}

export const formatTimeWithTimezone = (date: Date, timeZone = 'UTC') =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
    timeZoneName: 'short',
  }).format(date)
