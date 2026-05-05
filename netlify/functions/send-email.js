export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: 'RESEND_API_KEY not configured' };
  }

  const { to, orgName, score, stage, dimensions } = JSON.parse(event.body);

  const dimRows = dimensions.map(d =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${d.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${d.level}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${d.detail}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
      <div style="background:#0F3D6E;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="margin:0;font-size:20px">Diagnóstico de Madurez Digital y AI</h1>
        <p style="margin:8px 0 0;opacity:.75">AI for Nonprofits Workshop 2026 · Fundación V2A</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e5e7eb">
        <p style="margin:0 0 16px">Hola, aquí están los resultados de <strong>${orgName}</strong>:</p>
        <div style="background:#185FA5;color:#fff;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
          <div style="font-size:42px;font-weight:900;line-height:1">${score}</div>
          <div style="font-size:14px;opacity:.7">/ 4.0</div>
          <div style="display:inline-block;background:rgba(255,255,255,.2);padding:5px 16px;border-radius:20px;margin-top:8px;font-weight:700">${stage}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px 12px;text-align:left">Dimensión</th>
              <th style="padding:8px 12px;text-align:left">Nivel</th>
              <th style="padding:8px 12px;text-align:left">Descripción</th>
            </tr>
          </thead>
          <tbody>${dimRows}</tbody>
        </table>
        <p style="margin:20px 0 0;font-style:italic;color:#374151;border-left:4px solid #185FA5;padding-left:12px">
          "No necesitas transformar toda tu organización hoy. Empieza con un caso de uso que genere valor."
        </p>
      </div>
      <div style="background:#f9fafb;padding:14px;text-align:center;font-size:12px;color:#9ca3af;border-radius:0 0 12px 12px">
        Fundación V2A · We Serve Academy
      </div>
    </div>`;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Diagnóstico V2A <onboarding@resend.dev>', // cambia al dominio verificado en Resend
      to: [to],
      subject: `Tu diagnóstico de madurez digital — ${orgName}`,
      html,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return { statusCode: 502, body: err };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
