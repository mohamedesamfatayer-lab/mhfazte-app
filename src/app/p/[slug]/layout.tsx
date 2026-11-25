import { projects } from '@/registry'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ConfinementGuard } from '@/components/pwa/ConfinementGuard'
import { SwRegistrar } from '@/components/pwa/SwRegistrar'
import '@/projects/mhfazte/theme.css'
import '@/projects/demo/theme.css'

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}
  return {
    title: project.title,
    description: project.summary,
    manifest: `/p/${slug}/manifest.webmanifest`,
  }
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  const dataAttr = { [`data-${slug}`]: '' } as Record<string, string>

  return (
    <div {...dataAttr} style={{ minHeight: '100dvh', background: project.appBg }}>
      <ConfinementGuard slug={slug} />
      <SwRegistrar slug={slug} />
      {children}
    </div>
  )
}
