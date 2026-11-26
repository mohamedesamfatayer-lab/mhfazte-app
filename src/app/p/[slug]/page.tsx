import { projects } from '@/registry'
import { viewMap } from '@/view-map'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  const ProjectView = viewMap[slug]
  if (!ProjectView) notFound()

  return <ProjectView />
}
