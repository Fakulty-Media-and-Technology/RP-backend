export const daysToMilliseconds = (days: number) => days * 24 * 60 * 60 * 1000

export const addHours = (date: Date, hours: number) => {
  date.setHours(date.getHours() + hours)
}
