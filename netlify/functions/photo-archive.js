// Zet toegevoegde foto's op 'gearchiveerd': ze verdwijnen dan van de site onder
// "Toegevoegd" (ze staan dan in de OneDrive-map en komen bij de volgende update
// als gewone foto mee). De foto's zelf worden NIET verwijderd.
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
  if (!checkSession(b.session, 'intern'))
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'auth' }) };

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('eifotos');

    let archief = [];
    try {
      const a = await store.get('archief.json', { type: 'json' });
      if (a && Array.isArray(a.keys)) archief = a.keys;
    } catch (e) {}

    let nieuw = [];
    if (Array.isArray(b.keys) && b.keys.length) {
      nieuw = b.keys.map(String);
    } else {
      const res = await store.list();
      nieuw = (res && res.blobs ? res.blobs : []).map(x => x.key).filter(k => k !== 'archief.json');
    }
    const set = {};
    archief.concat(nieuw).forEach(k => { set[k] = 1; });
    const keys = Object.keys(set);
    await store.setJSON('archief.json', { keys: keys, bij: new Date().toISOString() });
    return { statusCode: 200, body: JSON.stringify({ ok: true, gearchiveerd: nieuw.length, totaal: keys.length }) };
  } catch (e) {
    console.log('blob-archive-fout', String(e));
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'opslag' }) };
  }
};
