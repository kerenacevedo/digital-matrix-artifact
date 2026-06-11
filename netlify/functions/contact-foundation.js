export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: 'RESEND_API_KEY not configured' };
  }

  const { name, email, organization, type, message, lang } = JSON.parse(event.body);

  const typeLabels = {
    'osfl-fellows':  'OSFL — WeServe Fellows',
    'osfl-projects': 'OSFL — WeServe Projects',
    'osfl-partners': 'OSFL — WeServe Partners',
    'funder':        'Fundación / Empresa — Apoyo a la misión',
    'otro':          'Otro',
  };

  const typeLabel = typeLabels[type] || type;
  const subject   = lang === 'en'
    ? `Fundación V2A — New contact: ${name}`
    : `Fundación V2A — Nuevo contacto: ${name}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <div style="background:#12295a;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <p style="margin:0 0 4px;font-size:13px;opacity:.6;letter-spacing:.08em;text-transform:uppercase">Fundación V2A</p>
        <h1 style="margin:0;font-size:20px;font-weight:700">Nuevo mensaje de contacto</h1>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e7eb">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151;width:140px">Nombre</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827">${name}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151">Email</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6"><a href="mailto:${email}" style="color:#1D4289">${email}</a></td>
          </tr>
          ${organization ? `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151">Organización</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827">${organization}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#374151">Tipo</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">
              <span style="background:#e8f5fc;color:#1D4289;padding:3px 10px;border-radius:4px;font-weight:600;font-size:13px">${typeLabel}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-weight:600;color:#374151;vertical-align:top">Mensaje</td>
            <td style="padding:10px 12px;color:#374151;line-height:1.6">${message.replace(/\n/g, '<br>')}</td>
          </tr>
        </table>
      </div>
      <div style="background:#f9fafb;padding:14px;text-align:center;font-size:12px;color:#9ca3af;border-radius:0 0 12px 12px">
        Enviado desde v2afoundation.org · Fundación V2A
      </div>
    </div>`;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Fundación V2A <contacto@v2afoundation.org>',
      to: ['gracielasalcedo@v2aconsulting.com', 'fundacionv2a@gmail.com'],
      reply_to: email,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return { statusCode: 502, body: err };
  }

  // ── Google Sheets logging (fire-and-forget) ──
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyRjz-IGj6L2EFhZg4tYSqdbyGh8HxCAy353467zSbFfOy60uKXuKI2DzYes_sWSZie/exec';
  try {
    await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, organization, type: typeLabel, message, lang }),
    });
  } catch (_) {
    // Sheet logging failure doesn't block the response
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
