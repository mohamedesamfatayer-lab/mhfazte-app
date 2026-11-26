export interface ProjectIcon {
  bg: string
  fg: string
  path: string
  stroke?: boolean
  strokeWidth?: number
}

export interface ProjectEntry {
  slug: string
  title: string
  summary: string
  tags: string[]
  appBg: string
  orientation: 'portrait' | 'landscape' | 'any'
  icon: ProjectIcon
  requiresAuth?: boolean
}

export const projects: ProjectEntry[] = [
  {
    slug: 'mhfazte',
    title: 'محفظتي',
    summary: 'إدارة المال والديون والمصروفات',
    tags: ['finance'],
    appBg: '#1a2535',
    orientation: 'portrait',
    requiresAuth: true,
    icon: {
      bg: '#1d4ed8',
      fg: '#fbbf24',
      path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      stroke: true,
    },
  },
  {
    slug: 'maktaba',
    title: 'المكتبة',
    summary: 'نظام محاسبة المكتبة المتكامل — مبيعات، مشتريات، مخزون',
    tags: ['accounting', 'inventory'],
    appBg: '#1a2535',
    orientation: 'any',
    requiresAuth: true,
    icon: {
      bg: '#166534',
      fg: '#86efac',
      path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      stroke: true,
    },
  },
]
