import { projects } from '@/registry'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return new Response('Not Found', { status: 404 })

  const sw = `
const STATIC = '${slug}-static-v1';
const PAGES  = '${slug}-pages-v1';
const OFFLINE = '/p/${slug}/offline';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(PAGES).then(c => c.add(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('${slug}-') && k !== STATIC && k !== PAGES).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC).then(c =>
        c.match(e.request).then(hit =>
          hit ?? fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; })
        )
      )
    );
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(PAGES).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(hit => hit ?? caches.match(OFFLINE))
        )
    );
  }
});
`.trim()

  return new Response(sw, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': `/p/${slug}/`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
