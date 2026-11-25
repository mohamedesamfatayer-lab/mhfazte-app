import { projects } from '@/registry'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return new NextResponse('Not Found', { status: 404 })

  const base = `/p/${project.slug}`

  return NextResponse.json({
    name: project.title,
    short_name: project.title,
    description: project.summary,
    id: `${base}/`,
    scope: `${base}/`,
    start_url: `${base}/`,
    display: 'standalone',
    orientation: project.orientation,
    background_color: project.appBg,
    theme_color: project.appBg,
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: `${base}/icons/192`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}/icons/192?maskable=1`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${base}/icons/512`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}/icons/512?maskable=1`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  })
}
