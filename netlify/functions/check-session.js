// Bij elke paginaopening: is er nog een geldige 30-dagen-sessie? Zo ja -> direct binnen.
const { sign, unb64, eq } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'no' };
  if (!process.env.AUTH_SECRET) return { statusCode: 500, body: JSON.stringify({ error: 'config' }) };

  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'bad' }; }
  const portal = String(b.portal || '');

  let email, p2, sexp, ssig;
  try {
    const p = unb64(String(b.session || '')).split('|');
    email = p[0]; p2 = p[1]; sexp = parseInt(p[2], 10); ssig = p[3];
  } catch (e) { return { statusCode: 200, body: JSON.stringify({ ok: false }) }; }

  if (p2 !== portal) return { statusCode: 200, body: JSON.stringify({ ok: false }) };
  if (!sexp || Date.now() > sexp) return { statusCode: 200, body: JSON.stringify({ ok: false }) };

  const ssig2 = sign('S|' + email + '|' + portal + '|' + sexp);
  if (!eq(ssig2, ssig)) return { statusCode: 200, body: JSON.stringify({ ok: false }) };

  return { statusCode: 200, body: JSON.stringify({ ok: true, email: email }) };
};
