import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabase()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Register user in platform_users using the user returned directly from exchange
      const user = sessionData?.user
      if (user) {
        const meta = user.user_metadata
        const name = meta?.full_name ?? meta?.name ?? user.email?.split('@')[0] ?? 'مستخدم'

        // Count existing users using server client (session is set after exchange)
        const { count } = await supabase.from('platform_users')
          .select('id', { count: 'exact', head: true })
        const isFirst = (count ?? 0) === 0

        const { error: insertErr } = await supabase.from('platform_users').insert({
          id: user.id,
          email: user.email ?? '',
          name,
          avatar_url: meta?.avatar_url ?? null,
          is_admin: isFirst,
        })
        if (insertErr && insertErr.code !== '23505') {
          console.error('[callback] platform_users insert error:', insertErr)
        }
      }
      const redirectTo = next.startsWith('/') ? next : '/'
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
