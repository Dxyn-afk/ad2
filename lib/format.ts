import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'

export const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatAngka(n: number, decimals = 2): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatTanggal(tgl: string): string {
  try {
    const d = parseISO(tgl)
    return format(d, 'dd MMM yyyy', { locale: id })
  } catch { return tgl }
}

export function formatTanggalLengkap(tgl: string): string {
  try {
    const d = parseISO(tgl)
    return format(d, "EEEE, dd MMMM yyyy", { locale: id })
  } catch { return tgl }
}

export function formatBulan(tgl: string): string {
  try {
    const d = parseISO(tgl)
    return format(d, 'MMMM yyyy', { locale: id })
  } catch { return tgl }
}

export function getHari(tgl: string): string {
  try {
    const d = parseISO(tgl)
    return format(d, 'EEEE', { locale: id })
  } catch { return '' }
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function thisWeekRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
}

export function thisMonthRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function monthRange(year: number, month: number): { from: string; to: string } {
  const d = new Date(year, month - 1, 1)
  return {
    from: format(startOfMonth(d), 'yyyy-MM-dd'),
    to: format(endOfMonth(d), 'yyyy-MM-dd'),
  }
}

export function parseRupiahInput(val: string): number {
  return parseFloat(val.replace(/[^0-9.]/g, '')) || 0
}
