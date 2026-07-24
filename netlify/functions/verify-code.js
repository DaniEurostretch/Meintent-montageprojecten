// Stap 3: controleert de code tegen de challenge en geeft bij succes een 30-dagen-sessie terug.
const { sign, b64url, unb64, eq } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'no' };
  if (!process.env.AUTH_SECRET) return { statusCode: 500, body: JSON.stringify({ error: 'config' }) };

  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'bad' }; }
  const code = String(b.code || '').trim();
  const remember = b.remember !== false; // standaard 30 dagen; alleen uit als expliciet false

  let email, portal, exp, sig;
  try {
    const p = unb64(String(b.challenge || '')).split('|');
    email = p[0]; portal = p[1]; exp = parseInt(p[2], 10); sig = p[3];
  } catch (e) { return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'code' }) }; }

  if (!exp || Date.now() > exp)
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'expired' }) };

  const sig2 = sign(email + '|' + portal + '|' + code + '|' + exp);
  if (!eq(sig2, sig))
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'code' }) };

  // Alleen een 30-dagen-sessie teruggeven als de gebruiker 'ingelogd blijven' aanvinkte.
  // Anders: wel binnen, maar geen sessie -> volgend bezoek opnieuw inloggen.
  if (!remember)
    return { statusCode: 200, body: JSON.stringify({ ok: true, email: email }) };

  const sexp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 dagen
  const ssig = sign('S|' + email + '|' + portal + '|' + sexp);
  const session = b64url(email + '|' + portal + '|' + sexp + '|' + ssig);

  return { statusCode: 200, body: JSON.stringify({ ok: true, session: session, email: email }) };
};
