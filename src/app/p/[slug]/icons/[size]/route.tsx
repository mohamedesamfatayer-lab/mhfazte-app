import { ImageResponse } from 'next/og'
import { projects } from '@/registry'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; size: string }> }
) {
  const { slug, size } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return new Response('Not Found', { status: 404 })

  const dim = parseInt(size, 10)
  if (![192, 512].includes(dim)) return new Response('Bad size', { status: 400 })

  const maskable = new URL(req.url).searchParams.has('maskable')
  const contentSize = Math.round(dim * (maskable ? 0.6 : 0.75))
  const { bg, fg, path, stroke = false, strokeWidth = 1.5 } = project.icon

  return new ImageResponse(
    (
      <div
        style={{
          width: dim,
          height: dim,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: maskable ? 0 : dim * 0.2,
        }}
      >
        <svg
          width={contentSize}
          height={contentSize}
          viewBox="0 0 24 24"
          fill={stroke ? 'none' : fg}
          stroke={stroke ? fg : 'none'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={path} />
        </svg>
      </div>
    ),
    { width: dim, height: dim }
  )
}
