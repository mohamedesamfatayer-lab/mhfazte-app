import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'

// Admin client that bypasses RLS
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  // Verify user is authenticated
  const serverSupabase = await createServerSupabase()
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { account, debts, payments, transactions, expenses, reminders, recurring } = body
  const admin = adminClient()
  const userId = user.id
  const results: Record<string, any> = {}

  // 1. ACCOUNT
  if (account) {
    const { error } = await admin.from('mhfazte_account')
      .upsert({ user_id: userId, balances: account.balances }, { onConflict: 'user_id' })
    results.account = error ? `✗ ${error.message}` : '✓'
  }

  // 2. DEBTS
  const debtIdMap: Record<string, string> = {}
  let debtFirstError: string | null = null
  if (debts?.length) {
    for (const d of debts) {
      const type = d.type === 'creditor' ? 'دائن' : 'مدين'
      const { data, error } = await admin.from('mhfazte_debts')
        .insert({
          user_id: userId, type,
          subtype: d.subtype ?? null,
          name: d.name ?? '',
          currency: d.currency ?? 'EGP',
          amount: d.totalAmount ?? d.amount ?? 0,
          remaining: d.remaining ?? d.totalAmount ?? 0,
          date: d.date ?? null,
          note: d.note ?? null,
        })
        .select('id').single()
      if (error) { if (!debtFirstError) debtFirstError = error.message }
      else if (data) debtIdMap[d._fbId] = (data as any).id
    }
    const count = Object.keys(debtIdMap).length
    results.debts = debtFirstError
      ? `✗ ${count}/${debts.length} — ${debtFirstError}`
      : `✓ ${count} / ${debts.length}`
  }

  // 3. PAYMENTS
  if (payments?.length) {
    let ok = 0
    for (const p of payments) {
      const sbDebtId = debtIdMap[p.debtId]
      if (!sbDebtId) continue
      const { error } = await admin.from('mhfazte_payments').insert({
        debt_id: sbDebtId,
        amount: p.amount ?? 0,
        date: p.date ?? null,
        ref: p.ref ?? null,
        note: p.note ?? null,
      })
      if (!error) ok++
    }
    results.payments = `✓ ${ok} / ${payments.length}`
  }

  // 4. TRANSACTIONS
  if (transactions?.length) {
    const rows = transactions.map((t: any) => ({
      user_id: userId,
      type: t.type ?? 'deposit',
      amount: t.amount ?? 0,
      currency: t.currency ?? 'EGP',
      note: t.note ?? null,
      date: t.date ?? null,
      category: t.category ?? null,
    }))
    for (let i = 0; i < rows.length; i += 50) {
      await admin.from('mhfazte_transactions').insert(rows.slice(i, i + 50))
    }
    results.transactions = `✓ ${rows.length}`
  }

  // 5. EXPENSES
  if (expenses?.length) {
    const rows = expenses.map((e: any) => ({
      user_id: userId,
      category: e.category ?? 'أخرى',
      amount: e.amount ?? 0,
      currency: e.currency ?? 'EGP',
      note: e.note ?? null,
      date: e.date ?? null,
    }))
    for (let i = 0; i < rows.length; i += 50) {
      await admin.from('mhfazte_expenses').insert(rows.slice(i, i + 50))
    }
    results.expenses = `✓ ${rows.length}`
  }

  // 6. REMINDERS
  if (reminders?.length) {
    for (const r of reminders) {
      await admin.from('mhfazte_reminders').insert({
        user_id: userId,
        title: r.title ?? r.text ?? '',
        date: r.date ?? null,
        note: r.note ?? null,
        done: r.done ?? false,
      })
    }
    results.reminders = `✓ ${reminders.length}`
  }

  // 7. RECURRING
  if (recurring?.length) {
    for (const r of recurring) {
      await admin.from('mhfazte_recurring').insert({
        user_id: userId,
        name: r.name ?? '',
        type: r.type ?? 'expense',
        currency: r.currency ?? 'EGP',
        amount: r.amount ?? 0,
        day: r.day ?? null,
        last_run: r.lastRun ?? null,
      })
    }
    results.recurring = `✓ ${recurring.length}`
  }

  return NextResponse.json({ ok: true, results })
}
