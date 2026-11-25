import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

export const viewMap: Record<string, ComponentType> = {
  mhfazte: dynamic(() => import('@/projects/mhfazte/view')),
  demo: dynamic(() => import('@/projects/demo/view')),
}
