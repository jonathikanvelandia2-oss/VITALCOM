import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utilidad estándar para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
