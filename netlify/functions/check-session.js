// Bij elke paginaopening: is er nog een geldige sessie (een half jaar)? Zo ja -> direct binnen.
// De houdbaarheid staat in de sessie zelf; die wordt bij het inloggen gezet in verify-code.js.
// Sinds 2 nov 2026: de sessie staat ook in een cookie (mt_s_<portaal>). Is localStorage leeg
// (Safari wist dat na 7 dagen), dan wordt de sessie uit de cookie teruggegeven.
const { sign, unb64, eq } = require('./_lib');

function readCookie(headers, name) {
  const c = (headers && (headers.cookie || headers.Cookie)) || '';
  for (const part of c.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function check(session, portal) {
  try {
    const p = unb64(String(session || '')).split('|');
    const email = p[0], p2 = p[1], sexp = parseInt(p[2], 10), ssig = p[3];
    if (p2 !== portal) return null;
    if (!sexp || Date.now() > sexp) return null;
    if (!eq(sign('S|' + email + '|' + portal + '|' + sexp), ssig)) return null;
    return { email: email, sexp: sexp };
  } catch (e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'no' };
  if (!process.env.AUTH_SECRET) return { statusCode: 500, body: JSON.stringify({ error: 'config' }) };

  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'bad' }; }
  const portal = String(b.portal || '');

  let session = String(b.session || '');
  let r = session ? check(session, portal) : null;
  if (!r) {
    session = readCookie(event.headers, 'mt_s_' + portal);
    r = session ? check(session, portal) : null;
  }
  if (!r) return { statusCode: 200, body: JSON.stringify({ ok: false }) };

  // cookie (opnieuw) zetten met de resterende looptijd, zodat ook oudere sessies er een krijgen
  const rest = Math.max(0, Math.floor((r.sexp - Date.now()) / 1000));
  const cookie = 'mt_s_' + portal + '=' + session + '; Max-Age=' + rest + '; Path=/; Secure; HttpOnly; SameSite=Lax';
  return { statusCode: 200, headers: { 'Set-Cookie': cookie },
           body: JSON.stringify({ ok: true, email: r.email, session: session }) };
};
