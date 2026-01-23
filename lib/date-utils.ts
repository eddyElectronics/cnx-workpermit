/**
 * Date utilities for Thailand timezone (UTC+7)
 */

/**
 * Get current date/time in Thailand timezone (UTC+7)
 */
export function getThailandDate(): Date {
  const now = new Date()
  // Convert to Thailand time (UTC+7)
  const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  return thailandTime
}

/**
 * Get current date in YYYY-MM-DD format (Thailand timezone)
 */
export function getThailandDateString(): string {
  const date = getThailandDate()
  return date.toISOString().split('T')[0]
}

/**
 * Get current date/time in ISO format (Thailand timezone)
 */
export function getThailandISOString(): string {
  return getThailandDate().toISOString()
}

/**
 * Format date to DD/MM/YYYY (Thailand timezone)
 */
export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}
