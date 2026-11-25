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
    slug: 'demo',
    title: 'تجريبي',
    summary: 'مشروع فارغ للاختبار',
    tags: [],
    appBg: '#0f172a',
    orientation: 'any',
    icon: {
      bg: '#7c3aed',
      fg: '#ffffff',
      path: 'M12 2l9 5-9 5-9-5 9-5zM3 17l9 5 9-5M3 12l9 5 9-5',
      stroke: true,
    },
  },
]
