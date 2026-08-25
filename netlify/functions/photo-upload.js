// Foto uploaden vanuit het interne portaal. Alleen met een geldige intern-sessie.
// Opslag: Netlify Blobs (store 'eifotos'), sleutel = "<groep>/<tijd>-<naam>.jpg".
const { sign, unb64, eq } = require('./_lib');

function checkSession(session, portal) {
  try {
    const p = unb64(String(session || '')).split('|');
    const email = p[0], p2 = p[1], sexp = parseInt(p[2], 10), ssig = p[3];
    if (p2 !== portal) return null;
    if (!sexp || Date.now() > sexp) return null;
    if (!eq(sign('S|' + email + '|' + portal + '|' + sexp), ssig)) return null;
    return email;
  } catch (e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'no' };
  if (!process.env.AUTH_SECRET) return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'config' }) };

  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'bad' }; }

  const email = checkSession(b.session, 'intern');
  if (!email) return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'auth' }) };

  const groep = String(b.groep || '').replace(/[^A-Za-z0-9 _().&-]/g, '').slice(0, 80);
  const naam  = String(b.naam || 'foto.jpg').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 60);
  const data  = String(b.data || '');
  if (!groep) return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'groep' }) };

  const m = data.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!m) return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'formaat' }) };
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 6 * 1024 * 1024)
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'groot' }) };

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('eifotos');
    const key = groep + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + naam;
    await store.set(key, buf, {
      metadata: { groep: groep, naam: naam, door: email, op: new Date().toISOString(), type: 'image/jpeg' }
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true, key: key }) };
  } catch (e) {
    console.log('blob-upload-fout', String(e));
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'opslag' }) };
  }
};
