export const daysToMilliseconds = (days: number) => days * 24 * 60 * 60 * 1000

export const addHours = (date: Date, hours: number) => {
  date.setHours(date.getHours() + hours)
}

export const addDays = (date: Date, days: number) => {
  date.setDate(date.getDate() + days)
}

export const setToStartOfDay = (date: Date) => {
  date.setHours(0, 0, 0, 0)
}
