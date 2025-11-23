export function printHtml(html: string, paperWidthMm?: number) {
  const win = window.open('', '_blank', 'width=480,height=800');
  if (!win) return;
  win.document.open();
  const width = paperWidthMm || 80;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt</title>
  <style>
    /* Default thermal receipt size */
    @page { size: ${width}mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; }
    @media print { .no-print { display: none !important; } }
    body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial;}
  </style>
  </head><body>${html}<div class="no-print" style="padding:12px;text-align:center"><button onclick="window.print();">Print</button></div></body></html>`);
  win.document.close();
}

type ReceiptItem = { name: string; qty: number; unit: number; total: number };
type ReceiptOrder = { order_number?: string; created_at?: string; cashier_name?: string; customer_name?: string; items?: ReceiptItem[]; total: number };
type ReceiptSettings = { business_name?: string|null; logo_url?: string|null; address?: string|null; phone?: string|null; footer_note?: string|null; show_order_number?: boolean|null; theme?: string|null; accent_color?: string|null };

export function buildReceiptHtml(settings: ReceiptSettings & { paper_width_mm?: number|null }, mode: 'order'|'no_order', order?: ReceiptOrder, custom?: { title?: string; lines?: string[]; total?: number }) {
  const acc = settings.accent_color || '#111827';
  const showNo = settings.show_order_number !== false;
  const dateStr = order?.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString();
  const itemsRows = (order?.items || []).map(i => `<tr><td>${escapeHtml(i.name)}</td><td style="text-align:right">${i.qty} x ${i.unit.toFixed(2)}</td><td style="text-align:right">${i.total.toFixed(2)}</td></tr>`).join('');
  const customLines = (custom?.lines || []).map(l => `<div>${escapeHtml(l)}</div>`).join('');
  const headLogo = settings.logo_url ? `<img src="${settings.logo_url}" alt="logo" style="max-height:60px;margin-bottom:6px;"/>` : '';

  const width = settings.paper_width_mm || 80;
  return `
  <div style="width:${width}mm;max-width:${width}mm;margin:0 auto;padding:12px;line-height:1.2">
    <div style="text-align:center;border-bottom:1px dashed #e5e7eb;padding-bottom:8px;margin-bottom:8px">
      ${headLogo}
      <div style="font-weight:700;color:${acc}">${escapeHtml(settings.business_name || 'Receipt')}</div>
      ${settings.address ? `<div style="font-size:12px;color:#6b7280">${escapeHtml(settings.address)}</div>`:''}
      ${settings.phone ? `<div style="font-size:12px;color:#6b7280">${escapeHtml(settings.phone)}</div>`:''}
    </div>
    <div style="font-size:12px;color:#374151;margin-bottom:8px">
      <div><strong>Date:</strong> ${dateStr}</div>
      ${mode === 'order' && showNo && order?.order_number ? `<div><strong>Order #:</strong> ${order.order_number}</div>`:''}
      ${order?.cashier_name ? `<div><strong>Cashier:</strong> ${escapeHtml(order.cashier_name)}</div>`:''}
      ${order?.customer_name ? `<div><strong>Customer:</strong> ${escapeHtml(order.customer_name)}</div>`:''}
      ${mode === 'no_order' && custom?.title ? `<div><strong>Title:</strong> ${escapeHtml(custom.title)}</div>`:''}
    </div>
    ${(order?.items && order.items.length>0) ? `<table style="width:100%;font-size:12px;margin-bottom:8px"><tbody>${itemsRows}</tbody></table>`:''}
    ${customLines}
    <div style="border-top:1px dashed #e5e7eb;padding-top:8px;margin-top:8px;font-weight:700;display:flex;justify-content:space-between">
      <span>Total</span>
      <span>${(order?.total ?? custom?.total ?? 0).toFixed(2)}</span>
    </div>
    ${settings.footer_note ? `<div style="text-align:center;margin-top:10px;font-size:11px;color:#6b7280">${escapeHtml(settings.footer_note)}</div>`:''}
  </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] as string));
}
