'use client'

import { useEffect } from 'react'

export function SwRegistrar({ slug }: { slug: string }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register(`/p/${slug}/sw`, { scope: `/p/${slug}/` })
      .catch((err) => {
        console.error(`[SW] Registration failed for ${slug}:`, err)
      })
  }, [slug])

  return null
}
