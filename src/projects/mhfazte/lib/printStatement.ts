interface Payment {
  id: string; amount: number; date: string | null;
  note: string | null; ref?: string | null;
}

interface DebtInfo {
  name: string; amount: number; remaining: number;
  currency: string; subtype: string | null; note?: string | null;
  type?: string;
}

const CUR_LABEL: Record<string, string> = {
  EGP: 'ج.م', SAR: 'ر.س', USD: '$',
}

function numDate(str: string | null | undefined): string {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  if (isNaN(d.getTime())) return str
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function fmtN(n: number): string {
  return String(Math.round(Number(n) || 0))
}

export function printDebtStatement(debt: DebtInfo, payments: Payment[]) {
  const sym = CUR_LABEL[debt.currency] ?? debt.currency
  const paid = debt.amount - debt.remaining
  const isDebtor = debt.type !== 'دائن'

  const sorted = [...payments].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date)
    return 0
  })

  let running = debt.amount
  const rows = sorted.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:#666;padding:1rem;">لا توجد دفعات</td></tr>`
    : sorted.map((p, i) => {
      running = Math.max(0, running - (p.amount || 0))
      return `<tr>
        <td>${i + 1}</td>
        <td>${numDate(p.date)}</td>
        <td style="font-weight:700;color:#059669;">${fmtN(p.amount || 0)}</td>
        <td>${(p as any).ref || '—'}</td>
        <td style="font-weight:700;color:#dc2626;">${fmtN(running)}</td>
        <td style="text-align:right;">${p.note || '—'}</td>
      </tr>`
    }).join('')

  const now = new Date()
  const printDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>كشف حساب - ${debt.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Cairo',sans-serif;background:#fff;color:#000;padding:1.5cm;font-size:11pt;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  h1{text-align:center;font-size:16pt;color:#fff;font-weight:900;margin-bottom:1.4rem;
     background:#1e3a5f;padding:.6rem 1.5rem;border-radius:6px;display:inline-block;width:100%;}
  .info-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem;font-size:13pt;font-weight:900;color:#000;}
  .divider{border:none;border-top:2px solid #000;margin:.7rem 0;}
  table{width:100%;border-collapse:collapse;font-size:10.5pt;margin-top:.5rem;}
  th{background:#b8cce4;color:#000;padding:.75rem .7rem;border:1.5px solid #000;
     text-align:center;font-weight:900;white-space:nowrap;font-size:11.5pt;}
  td{padding:.5rem .7rem;border:1px solid #000;text-align:center;vertical-align:middle;color:#000;font-weight:700;}
  tr:nth-child(even) td{background:#eef4fb;}
  .summary{display:flex;gap:.6rem;margin-top:.8rem;}
  .sum-box{flex:1;border:2px solid #000;border-radius:4px;padding:.55rem;text-align:center;}
  .sum-total{background:#f0e6ff;}
  .sum-paid {background:#d9f2e6;}
  .sum-rem  {background:#fde8e8;}
  .sum-label{font-size:8.5pt;font-weight:700;color:#000;margin-bottom:.2rem;}
  .sum-val  {font-size:12pt;font-weight:900;color:#000;}
  .note-box{margin-top:.7rem;border:1.5px solid #000;border-radius:4px;padding:.5rem .8rem;font-size:10pt;color:#000;font-weight:700;}
  .footer{margin-top:1.2rem;font-size:9pt;color:#000;text-align:center;font-weight:700;
          border-top:1px solid #000;padding-top:.5rem;}
  @media print{body{padding:.6cm;}@page{margin:.7cm;size:A4 portrait;}}
</style>
</head>
<body>
  <h1>كشف حساب</h1>
  <div class="info-row"><span>الاسم :</span><span>${debt.name}</span></div>
  ${debt.subtype ? `<div class="info-row"><span>النوع :</span><span>${debt.subtype}</span></div>` : ''}
  <div class="info-row"><span>تاريخ الكشف :</span><span>${printDate}</span></div>
  <hr class="divider">
  <table>
    <thead>
      <tr>
        <th style="width:4%;">م</th>
        <th style="width:14%;">تاريخ الدفعة</th>
        <th style="width:14%;">الواصل (${sym})</th>
        <th style="width:14%;">رقم الحوالة</th>
        <th style="width:14%;">الباقي (${sym})</th>
        <th>البيان</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <div class="sum-box sum-total">
      <div class="sum-label">إجمالي الدين</div>
      <div class="sum-val">${fmtN(debt.amount)}</div>
    </div>
    <div class="sum-box sum-paid">
      <div class="sum-label">المدفوع</div>
      <div class="sum-val">${fmtN(paid)}</div>
    </div>
    <div class="sum-box sum-rem">
      <div class="sum-label">المتبقي</div>
      <div class="sum-val">${fmtN(debt.remaining)}</div>
    </div>
  </div>
  ${debt.note ? `<div class="note-box">ملاحظة: ${debt.note}</div>` : ''}
  <div class="footer">تاريخ الطباعة: ${printDate} &nbsp;|&nbsp; محفظتي</div>
  <script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ───── Print Person Account Statement (from Reports) ─────
export interface DebtRow {
  name: string; amount: number; remaining: number; currency: string;
  subtype: string | null; note: string | null; date: string | null; type: string;
}

export function printPersonStatement(name: string, debts: DebtRow[]) {
  const now = new Date()
  const printDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

  const rows = debts.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:#666;padding:1rem;">لا توجد بيانات</td></tr>`
    : debts.map((d, i) => {
      const isDebtor = d.type === 'مدين'
      const paid = Number(d.amount) - Number(d.remaining)
      const color = isDebtor ? '#dc2626' : '#059669'
      const bg = isDebtor ? '#fff5f5' : '#f0fff4'
      return `<tr style="background:${bg}">
        <td>${i + 1}</td>
        <td>${numDate(d.date)}</td>
        <td style="font-weight:800;">${fmtN(d.amount)}</td>
        <td>${CUR_LABEL[d.currency] ?? d.currency}</td>
        <td style="font-weight:700;color:${color};">${d.type}</td>
        <td style="text-align:right;">${d.note || d.subtype || '—'}</td>
      </tr>`
    }).join('')

  // Summary by currency
  const summaryByCur: Record<string, { total: number; paid: number; remaining: number }> = {}
  debts.forEach(d => {
    if (!summaryByCur[d.currency]) summaryByCur[d.currency] = { total: 0, paid: 0, remaining: 0 }
    const paid = Number(d.amount) - Number(d.remaining)
    summaryByCur[d.currency].total += Number(d.amount)
    summaryByCur[d.currency].paid += paid
    summaryByCur[d.currency].remaining += Number(d.remaining)
  })

  const sumRows = Object.entries(summaryByCur).map(([cur, s]) =>
    `<tr>
      <td>${cur}</td>
      <td style="font-weight:800;">${fmtN(s.total)}</td>
      <td style="font-weight:800;color:#059669;">${fmtN(s.paid)}</td>
      <td style="font-weight:800;color:#dc2626;">${fmtN(s.remaining)}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><title>كشف حساب - ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Cairo',sans-serif;background:#fff;color:#000;padding:1.5cm;font-size:11pt;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  h1{text-align:center;font-size:16pt;color:#fff;font-weight:900;margin-bottom:1.4rem;
     background:#1e3a5f;padding:.6rem 1.5rem;border-radius:6px;display:inline-block;width:100%;}
  .info-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:.25rem;font-size:12pt;font-weight:900;}
  .divider{border:none;border-top:2px solid #000;margin:.7rem 0;}
  table{width:100%;border-collapse:collapse;font-size:10.5pt;margin-top:.5rem;}
  th{background:#1e3a5f;color:#fff;padding:.75rem .7rem;border:1.5px solid #000;text-align:center;font-weight:900;white-space:nowrap;}
  td{padding:.5rem .7rem;border:1px solid #000;text-align:center;vertical-align:middle;color:#000;font-weight:600;}
  .sum-title{font-size:11pt;font-weight:900;text-align:left;margin-top:1rem;margin-bottom:.4rem;border-bottom:2px solid #000;padding-bottom:.3rem;}
  .sum-table th{background:#1e3a5f;color:#fff;}
  .footer{margin-top:1.2rem;font-size:9pt;color:#000;text-align:center;font-weight:700;border-top:1px solid #000;padding-top:.5rem;}
  @media print{body{padding:.6cm;}@page{margin:.7cm;size:A4 portrait;}}
</style>
</head>
<body>
  <h1>كشف حساب</h1>
  <div class="info-row">
    <span>الاسم : ${name}</span>
    <span>عدد السجلات : ${debts.length}</span>
  </div>
  <div class="info-row" style="font-size:10pt;font-weight:700;">
    <span>تاريخ الكشف : ${printDate}</span>
  </div>
  <hr class="divider">
  <table>
    <thead><tr>
      <th style="width:4%;">م</th>
      <th style="width:16%;">التاريخ</th>
      <th style="width:14%;">المبلغ</th>
      <th style="width:8%;">العملة</th>
      <th style="width:10%;">النوع</th>
      <th>البيان</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sum-title">الإجمالي حسب العملة</div>
  <table class="sum-table">
    <thead><tr><th>العملة</th><th>إجمالي الديون</th><th>إجمالي المدفوع</th><th>الباقي</th></tr></thead>
    <tbody>${sumRows}</tbody>
  </table>
  <div class="footer">تاريخ الطباعة: ${printDate} &nbsp;|&nbsp; محفظتي</div>
  <script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

// ───── Print Transactions Report ─────
interface TxRow {
  type: string; amount: number; currency: string;
  note: string | null; date: string | null; category: string | null;
}

export function printTransactionsReport(txs: TxRow[], title = 'تقرير المعاملات') {
  const typeLabel: Record<string, string> = {
    deposit: 'إيداع', withdraw: 'سحب', expense: 'مصروف',
    debt_payment: 'سداد دين', debt_receive: 'استلام دين',
  }

  const rows = txs.map((t, i) => `<tr>
    <td>${i + 1}</td>
    <td>${numDate(t.date)}</td>
    <td>${typeLabel[t.type] ?? t.type}</td>
    <td style="font-weight:700;">${fmtN(t.amount)}</td>
    <td>${t.currency}</td>
    <td style="text-align:right;">${t.note ?? t.category ?? '—'}</td>
  </tr>`).join('')

  const totals = txs.reduce((acc, t) => {
    const k = `${t.currency}|${t.type === 'deposit' || t.type === 'debt_receive' ? 'in' : 'out'}`
    acc[k] = (acc[k] ?? 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  const now = new Date()
  const printDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Cairo',sans-serif;background:#fff;color:#000;padding:1.5cm;font-size:11pt;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  h1{text-align:center;font-size:16pt;color:#fff;font-weight:900;margin-bottom:1.4rem;
     background:#1e3a5f;padding:.6rem 1.5rem;border-radius:6px;display:inline-block;width:100%;}
  .info-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem;font-size:11pt;font-weight:700;color:#000;}
  .divider{border:none;border-top:2px solid #000;margin:.7rem 0;}
  table{width:100%;border-collapse:collapse;font-size:10.5pt;margin-top:.5rem;}
  th{background:#1e3a5f;color:#fff;padding:.75rem .7rem;border:1.5px solid #000;text-align:center;font-weight:900;}
  td{padding:.5rem .7rem;border:1px solid #000;text-align:center;vertical-align:middle;color:#000;font-weight:600;}
  tr:nth-child(even) td{background:#f5f8ff;}
  .sum-table{margin-top:1rem;}
  .sum-table th{background:#b8cce4;color:#000;}
  .footer{margin-top:1.2rem;font-size:9pt;color:#000;text-align:center;font-weight:700;
          border-top:1px solid #000;padding-top:.5rem;}
  @media print{body{padding:.6cm;}@page{margin:.7cm;size:A4 portrait;}}
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="info-row"><span>عدد المعاملات :</span><span>${txs.length}</span></div>
  <div class="info-row"><span>تاريخ الكشف :</span><span>${printDate}</span></div>
  <hr class="divider">
  <table>
    <thead><tr>
      <th style="width:4%;">م</th>
      <th style="width:14%;">التاريخ</th>
      <th style="width:14%;">النوع</th>
      <th style="width:14%;">المبلغ</th>
      <th style="width:8%;">العملة</th>
      <th>البيان</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:1rem;color:#666;">لا توجد بيانات</td></tr>'}</tbody>
  </table>
  <table class="sum-table">
    <thead><tr><th>العملة</th><th>إجمالي وارد</th><th>إجمالي صادر</th></tr></thead>
    <tbody>
    ${Array.from(new Set(txs.map(t => t.currency))).map(cur => {
      const inAmt = totals[`${cur}|in`] ?? 0
      const outAmt = totals[`${cur}|out`] ?? 0
      return `<tr><td>${cur}</td><td style="color:#059669;font-weight:800;">${fmtN(inAmt)}</td><td style="color:#dc2626;font-weight:800;">${fmtN(outAmt)}</td></tr>`
    }).join('')}
    </tbody>
  </table>
  <div class="footer">تاريخ الطباعة: ${printDate} &nbsp;|&nbsp; محفظتي</div>
  <script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}
