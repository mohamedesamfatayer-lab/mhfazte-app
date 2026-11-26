'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function ConfinementGuard({ slug }: { slug: string }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (!isStandalone) return

    const projectRoot = `/p/${slug}`

    if (!pathname.startsWith(projectRoot)) {
      router.replace(projectRoot)
    }

    const handler = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a')
      if (!anchor || !anchor.href) return

      try {
        const url = new URL(anchor.href, location.origin)
        const isAllowed = url.origin === location.origin &&
          (url.pathname.startsWith(projectRoot) || url.pathname === '/')
        if (!isAllowed) {
          e.preventDefault()
          e.stopPropagation()
        }
      } catch {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [slug, pathname, router])

  return null
}
