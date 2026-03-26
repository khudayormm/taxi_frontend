import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const convertToSumma = (summa: number): string => {
  const str_sum = `${summa}`

  const cleanedString = str_sum.replace(/[^\d]/g, '')

  // Convert the cleaned string back to a number, then format it with spaces
  return `${cleanedString.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
}
