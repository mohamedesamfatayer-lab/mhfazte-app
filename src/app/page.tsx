'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { projects } from '@/registry'
import { createClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────
interface PlatformUser {
  id: string; email: string; name: string; avatar_url: string | null; is_admin: boolean; created_at: string
}
interface Permission { user_id: string; project_slug: string }
interface Me { id: string; name: string; email: string; avatar: string | null; is_admin: boolean }

type ActiveView = 'home' | 'users'

const PROJECT_COLOR: Record<string, string> = { mhfazte: '#2563eb', demo: '#7c3aed' }
const PROJECT_NAV_ICON: Record<string, string> = { mhfazte: 'fa-wallet', demo: 'fa-flask' }

// ── Main Page ──────────────────────────────────────────
export default function PlatformHome() {
  const [me, setMe]           = useState<Me | null>(null)
  const [view, setView]       = useState<ActiveView>('home')
  const [myPerms, setMyPerms] = useState<string[]>([])  // slugs I can access
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      const u = data.user
      const meta = u.user_metadata
      const name = meta?.full_name ?? meta?.name ?? u.email?.split('@')[0] ?? 'مستخدم'

      // Count existing users to determine if first (becomes admin)
      const { count } = await sb.from('platform_users').select('id', { count: 'exact', head: true })
      const isFirst = (count ?? 0) === 0

      // Upsert own row
      await sb.from('platform_users').upsert({
        id: u.id, email: u.email ?? '', name,
        avatar_url: meta?.avatar_url ?? null,
        is_admin: isFirst ? true : undefined,
      }, { onConflict: 'id', ignoreDuplicates: !isFirst })

      // Fetch own row (to get is_admin)
      const { data: row } = await sb.from('platform_users').select('is_admin').eq('id', u.id).single()
      const isAdmin = (row as any)?.is_admin ?? isFirst

      setMe({ id: u.id, name, email: u.email ?? '', avatar: meta?.avatar_url ?? null, is_admin: isAdmin })

      if (!isAdmin) {
        // Fetch permissions
        const { data: perms } = await sb.from('platform_permissions').select('project_slug').eq('user_id', u.id)
        setMyPerms((perms as Permission[] ?? []).map(p => p.project_slug))
      }
      setLoading(false)
    })
  }, [])

  const visibleProjects = me?.is_admin ? projects : projects.filter(p => myPerms.includes(p.slug))

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', direction: 'rtl',
      background: '#1a2535', fontFamily: "'Cairo', system-ui, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* ══ Sidebar overlay backdrop (mobile) ══ */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40,
        }} />
      )}

      {/* ══ Sidebar ══ */}
      <Sidebar me={me} view={view} setView={v => { setView(v); setSidebarOpen(false) }}
        visibleProjects={visibleProjects.map(p => p.slug)} showToast={showToast}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ══ Main ══ */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '1rem 1rem 3rem' }}>

        {/* Top bar */}
        <div style={{
          background: '#1e2d42', borderRadius: 12, padding: '.7rem 1rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', border: '1px solid rgba(255,255,255,.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{
              background: 'rgba(255,255,255,.07)', border: 'none', borderRadius: 7,
              color: '#94a3b8', cursor: 'pointer', padding: '.3rem .5rem', fontSize: '1rem',
            }}>
              <i className="fas fa-bars" />
            </button>
            <div>
              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '.82rem' }}>منصتي</span>
              <span style={{ color: 'rgba(255,255,255,.2)', margin: '0 .4rem' }}>/</span>
              <span style={{ color: '#94a3b8', fontSize: '.82rem' }}>{view === 'home' ? 'الرئيسية' : 'المستخدمون والصلاحيات'}</span>
            </div>
          </div>
          {me && (
            <span style={{ fontSize: '.7rem', color: '#64748b' }}>
              {new Date().toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#64748b' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
          </div>
        ) : view === 'users' && me?.is_admin ? (
          <UsersManager me={me} allProjects={projects.map(p => ({ slug: p.slug, title: p.title }))} showToast={showToast} />
        ) : (
          <ProjectsView me={me} visibleProjects={visibleProjects} />
        )}
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#1e2d42', border: '1px solid rgba(255,255,255,.12)',
          color: '#e2e8f0', borderRadius: 10, padding: '.6rem 1.4rem',
          fontSize: '.82rem', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,.5)', fontFamily: 'Cairo, sans-serif',
        }}>{toast}</div>
      )}
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────
function Sidebar({ me, view, setView, visibleProjects, showToast, sidebarOpen, setSidebarOpen }: {
  me: Me | null; view: ActiveView; setView: (v: ActiveView) => void
  visibleProjects: string[]; showToast: (m: string) => void
  sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void
}) {
  return (
    <aside style={{
      width: 230, minWidth: 230, height: '100dvh',
      position: 'fixed', top: 0, right: 0, zIndex: 50,
      background: '#141c2b', display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid rgba(255,255,255,.07)', overflowY: 'auto',
      transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform .25s ease',
    }}>
      {/* Brand */}
      <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,.4)',
          }}>
            <i className="fas fa-layer-group" style={{ color: '#fff', fontSize: '1rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>منصتي</div>
            <div style={{ fontSize: '.6rem', color: '#475569' }}>كل الأنظمة في مكان واحد</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: '.4rem' }}>
        {/* الرئيسية */}
        <SideItem icon="fa-house" label="الرئيسية" active={view === 'home'} color="#60a5fa"
          onClick={() => setView('home')} />

        <SideLabel>الأنظمة</SideLabel>
        {projects.filter(p => me?.is_admin || visibleProjects.includes(p.slug)).map(p => (
          <Link key={p.slug} href={`/p/${p.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <SideItem icon={PROJECT_NAV_ICON[p.slug] ?? 'fa-cube'} label={p.title}
              active={false} color={PROJECT_COLOR[p.slug] ?? '#94a3b8'} onClick={() => {}} />
          </Link>
        ))}

        {me?.is_admin && (
          <>
            <SideLabel>الإدارة</SideLabel>
            <SideItem icon="fa-users-gear" label="المستخدمون والصلاحيات"
              active={view === 'users'} color="#f59e0b" onClick={() => setView('users')} />
          </>
        )}
      </nav>

      {/* User */}
      {me && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '.8rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.6rem' }}>
            {me.avatar ? (
              <img src={me.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '.85rem',
              }}>{me.name[0]}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.name}</div>
              <div style={{ fontSize: '.6rem', color: '#475569' }}>{me.is_admin ? 'مدير النظام' : 'مستخدم'}</div>
            </div>
          </div>
          <button onClick={() => createClient().auth.signOut().then(() => { window.location.href = '/login' })} style={{
            width: '100%', padding: '.38rem', borderRadius: 7,
            border: '1px solid rgba(220,38,38,.4)', background: 'rgba(220,38,38,.12)',
            color: '#f87171', fontSize: '.72rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Cairo,sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
          }}>
            <i className="fas fa-right-from-bracket" />
            تسجيل الخروج
          </button>
        </div>
      )}
    </aside>
  )
}

function SideItem({ icon, label, active, color, onClick }: {
  icon: string; label: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
      padding: '.55rem 1rem', background: active ? 'rgba(37,99,235,.2)' : 'transparent',
      border: 'none', borderRight: `3px solid ${active ? color : 'transparent'}`,
      color: active ? '#fff' : '#94a3b8', fontSize: '.8rem', fontWeight: active ? 700 : 500,
      cursor: 'pointer', fontFamily: 'Cairo,sans-serif', textAlign: 'right', direction: 'rtl',
      transition: 'all .15s',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.04)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <i className={`fas ${icon}`} style={{ fontSize: '.8rem', width: 16, textAlign: 'center', color: active ? color : '#475569' }} />
      {label}
    </button>
  )
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '.58rem', color: '#475569', fontWeight: 700, padding: '.6rem 1rem .2rem', letterSpacing: .8 }}>
      {children}
    </div>
  )
}

// ── Projects View ──────────────────────────────────────
function ProjectsView({ me, visibleProjects }: { me: Me | null; visibleProjects: typeof projects }) {
  return (
    <>
      {/* Welcome */}
      <div style={{
        background: '#1e2d42', borderRadius: 14, padding: '1.4rem 1.6rem',
        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid rgba(255,255,255,.07)',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff', marginBottom: '.3rem' }}>
            {me ? `مرحباً، ${me.name.split(' ')[0]} 👋` : 'مرحباً بك 👋'}
          </div>
          <div style={{ color: '#64748b', fontSize: '.82rem' }}>اختر النظام الذي تريد العمل عليه</div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(37,99,235,.2)', border: '1px solid rgba(37,99,235,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="fas fa-layer-group" style={{ color: '#60a5fa', fontSize: '1.5rem' }} />
        </div>
      </div>

      {/* Cards */}
      {visibleProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
          <i className="fas fa-lock" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
          <div style={{ fontSize: '.9rem' }}>لا توجد أنظمة مخصصة لك بعد. تواصل مع المدير.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          {visibleProjects.map(p => {
            const color = PROJECT_COLOR[p.slug] ?? '#6366f1'
            return (
              <div key={p.slug} style={{
                flex: '1 1 240px', maxWidth: 320,
                background: '#1e2d42', borderRadius: 14,
                border: '1px solid rgba(255,255,255,.07)',
                boxShadow: '0 4px 20px rgba(0,0,0,.3)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ height: 4, background: color }} />
                <div style={{ padding: '1.2rem 1.2rem .8rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.9rem' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: color + '22',
                      border: `1px solid ${color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width={24} height={24} viewBox="0 0 24 24"
                        fill={p.icon.stroke ? 'none' : color}
                        stroke={p.icon.stroke ? color : 'none'}
                        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={p.icon.path} />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{p.title}</div>
                      <div style={{ fontSize: '.65rem', color: '#475569' }}>{p.tags.join(' · ') || 'نظام'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '.78rem', color: '#64748b', lineHeight: 1.6 }}>{p.summary}</div>
                </div>
                <div style={{ padding: '0 1.2rem 1.1rem' }}>
                  <Link href={`/p/${p.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: color, color: '#fff', borderRadius: 9,
                      padding: '.6rem 1rem', fontWeight: 700, fontSize: '.8rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
                      boxShadow: `0 4px 12px ${color}44`,
                    }}>
                      دخول <i className="fas fa-arrow-left" style={{ fontSize: '.7rem' }} />
                    </div>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ── Users Manager ──────────────────────────────────────
function UsersManager({ me, allProjects, showToast }: {
  me: Me
  allProjects: { slug: string; title: string }[]
  showToast: (m: string) => void
}) {
  const [users, setUsers]       = useState<PlatformUser[]>([])
  const [perms, setPerms]       = useState<Permission[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)

  const load = useCallback(async () => {
    const sb = createClient()
    const [u, p] = await Promise.all([
      sb.from('platform_users').select('*').order('created_at'),
      sb.from('platform_permissions').select('*'),
    ])
    if (u.data) setUsers(u.data as PlatformUser[])
    if (p.data) setPerms(p.data as Permission[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function hasPermission(userId: string, slug: string) {
    return perms.some(p => p.user_id === userId && p.project_slug === slug)
  }

  async function togglePermission(userId: string, slug: string) {
    if (userId === me.id) return // don't restrict yourself
    const sb = createClient()
    setSaving(`${userId}-${slug}`)
    if (hasPermission(userId, slug)) {
      await sb.from('platform_permissions').delete()
        .eq('user_id', userId).eq('project_slug', slug)
      setPerms(prev => prev.filter(p => !(p.user_id === userId && p.project_slug === slug)))
    } else {
      await sb.from('platform_permissions').insert({ user_id: userId, project_slug: slug })
      setPerms(prev => [...prev, { user_id: userId, project_slug: slug }])
    }
    setSaving(null)
    showToast('✅ تم تحديث الصلاحيات')
  }

  async function toggleAdmin(userId: string, currentVal: boolean) {
    if (userId === me.id) { showToast('لا يمكن تغيير صلاحيتك'); return }
    const sb = createClient()
    await sb.from('platform_users').update({ is_admin: !currentVal }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentVal } : u))
    showToast(!currentVal ? '✅ تم منح صلاحية المدير' : '✅ تم إلغاء صلاحية المدير')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: '4rem', color: '#64748b' }}>
      <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{
        background: '#1e2d42', borderRadius: 14, padding: '1.1rem 1.4rem',
        marginBottom: '1.4rem', display: 'flex', alignItems: 'center', gap: '.8rem',
        border: '1px solid rgba(255,255,255,.07)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: 'rgba(245,158,11,.2)', border: '1px solid rgba(245,158,11,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="fas fa-users-gear" style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>إدارة المستخدمين والصلاحيات</div>
          <div style={{ fontSize: '.72rem', color: '#64748b' }}>{users.length} مستخدم مسجل · حدد الأنظمة المسموح بها لكل مستخدم</div>
        </div>
      </div>

      {/* Users table */}
      <div style={{ background: '#1e2d42', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${allProjects.length}, 1fr) 90px`,
          padding: '.65rem 1.2rem',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          background: 'rgba(255,255,255,.03)',
        }}>
          <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700 }}>المستخدم</div>
          {allProjects.map(p => (
            <div key={p.slug} style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>
              {p.title}
            </div>
          ))}
          <div style={{ fontSize: '.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>مدير</div>
        </div>

        {/* User rows */}
        {users.map((u, i) => (
          <div key={u.id} style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${allProjects.length}, 1fr) 90px`,
            padding: '.8rem 1.2rem', alignItems: 'center',
            borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
            background: u.id === me.id ? 'rgba(37,99,235,.06)' : 'transparent',
          }}>
            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '.85rem',
                }}>{(u.name || u.email)[0]}</div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name || u.email}
                  {u.id === me.id && <span style={{ marginRight: '.3rem', fontSize: '.6rem', color: '#2563eb' }}>(أنت)</span>}
                </div>
                <div style={{ fontSize: '.6rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
            </div>

            {/* Permission toggles */}
            {allProjects.map(p => {
              const allowed = u.is_admin || hasPermission(u.id, p.slug)
              const key = `${u.id}-${p.slug}`
              const isSaving = saving === key
              return (
                <div key={p.slug} style={{ textAlign: 'center' }}>
                  <button onClick={() => togglePermission(u.id, p.slug)} disabled={u.is_admin || u.id === me.id || isSaving} style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: u.is_admin || u.id === me.id ? 'default' : 'pointer',
                    background: allowed ? '#16a34a' : '#374151',
                    position: 'relative', transition: 'background .2s',
                    opacity: u.is_admin ? .5 : 1,
                  }}>
                    <div style={{
                      position: 'absolute', top: 2,
                      right: allowed ? 2 : 'auto', left: allowed ? 'auto' : 2,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      transition: 'all .2s',
                    }} />
                  </button>
                </div>
              )
            })}

            {/* Admin toggle */}
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => toggleAdmin(u.id, u.is_admin)} disabled={u.id === me.id} style={{
                width: 36, height: 20, borderRadius: 10, border: 'none',
                cursor: u.id === me.id ? 'default' : 'pointer',
                background: u.is_admin ? '#d97706' : '#374151',
                position: 'relative', transition: 'background .2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2,
                  right: u.is_admin ? 2 : 'auto', left: u.is_admin ? 'auto' : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'all .2s',
                }} />
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '.85rem' }}>
            لا يوجد مستخدمون بعد
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', padding: '.8rem 1rem', background: '#1e2d42', borderRadius: 10, border: '1px solid rgba(245,158,11,.2)' }}>
        <div style={{ fontSize: '.72rem', color: '#94a3b8', lineHeight: 1.7 }}>
          <i className="fas fa-circle-info" style={{ color: '#f59e0b', marginLeft: '.4rem' }} />
          <strong style={{ color: '#f59e0b' }}>ملاحظة:</strong> المستخدمون يظهرون هنا بعد تسجيل دخولهم أول مرة عبر نفس رابط المنصة.
          المدير يرى جميع الأنظمة بغض النظر عن الصلاحيات. المفتاح الأصفر = مدير · المفتاح الأخضر = وصول للنظام.
        </div>
      </div>
    </div>
  )
}
