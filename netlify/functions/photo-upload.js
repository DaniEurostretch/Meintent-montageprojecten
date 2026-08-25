// Foto uploaden vanuit het interne portaal. Alleen met een geldige intern-sessie.
// Opslag: Netlify Blobs (store 'eifotos'), sleutel = "<groep>/<tijd>-<naam>.jpg".
// Eenvoudige sleutel die de interne pagina meestuurt (houdt bots buiten de deur).
const UPLOAD_TOKEN = 'ei-6Kq2wR9nT4xL';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'no' };

  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'bad' }; }

  if (String(b.token || '') !== UPLOAD_TOKEN)
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'auth' }) };
  const email = String(b.door || 'intern portaal').slice(0, 80);

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
