import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatNumber(n: number, decimals = 1) {
  return n.toFixed(decimals)
}

export function calcVolumeUtilization(
  product: { l: number; w: number; h: number },
  box: { l: number; w: number; h: number }
): number {
  const productVol = product.l * product.w * product.h
  const boxVol = box.l * box.w * box.h
  if (boxVol === 0) return 0
  return Math.min(100, (productVol / boxVol) * 100)
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
