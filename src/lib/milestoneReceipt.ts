function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MilestoneReceiptData {
  jobTitle: string;
  milestoneName: string;
  amountGyd: number;
  date: string;
  contractorName?: string;
  homeownerName?: string;
}

export function openMilestoneReceipt(data: MilestoneReceiptData) {
  const amount = Number(data.amountGyd) || 0;
  const formattedAmount = `GYD ${amount.toLocaleString('en-US')}`;
  const dateStr = data.date
    ? new Date(data.date).toLocaleDateString('en-GY', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Milestone Payment Receipt</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f6f8; color: #1a1a1a; padding: 24px; }
  .page { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; }
  .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-bottom: 28px; }
  .title { font-size: 22px; font-weight: 700; margin-bottom: 24px; }
  .row { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; }
  .value { font-weight: 600; text-align: right; }
  .stamp { display: inline-block; margin: 28px 0 8px; padding: 8px 18px; border: 2px solid #16a34a; color: #16a34a; border-radius: 8px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 13px; transform: rotate(-4deg); }
  .toolbar { max-width: 640px; margin: 20px auto 0; text-align: center; }
  .btn { display: inline-block; padding: 12px 28px; background: #15803d; color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn:hover { background: #166534; }
  .muted { font-size: 12px; color: #9ca3af; margin-top: 12px; }
  @media print { .toolbar { display: none; } body { background: #fff; padding: 0; } .page { border: none; border-radius: 0; } }
</style>
</head>
<body>
  <div class="page">
    <div class="brand">BuildGuyana.gy</div>
    <div class="brand-sub">Milestone Payment Receipt</div>
    <div class="title">Payment Receipt</div>
    <div class="row"><span class="label">Job Name</span><span class="value">${escapeHtml(data.jobTitle)}</span></div>
    <div class="row"><span class="label">Milestone</span><span class="value">${escapeHtml(data.milestoneName)}</span></div>
    <div class="row"><span class="label">Amount</span><span class="value">${escapeHtml(formattedAmount)}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(dateStr)}</span></div>
    ${data.contractorName ? `<div class="row"><span class="label">Tradesperson</span><span class="value">${escapeHtml(data.contractorName)}</span></div>` : ''}
    <div class="stamp">Paid &amp; Confirmed</div>
  </div>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <div class="muted">Use your browser's print dialog to save this receipt as a PDF.</div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}