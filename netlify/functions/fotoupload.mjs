// Foto uploaden vanuit het interne portaal (moderne functievorm: blobs werkt hier native).
import { getStore } from '@netlify/blobs';

const UPLOAD_TOKEN = 'ei-6Kq2wR9nT4xL';

export default async (req) => {
  const json = (o, s = 200) =>
    new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  let b;
  try { b = await req.json(); } catch (e) { return json({ ok: false, error: 'body' }, 400); }

  if (String(b.token || '') !== UPLOAD_TOKEN) return json({ ok: false, error: 'auth' });

  const door  = String(b.door || 'intern portaal').slice(0, 80);
  const groep = String(b.groep || '').replace(/[^A-Za-z0-9 _().&-]/g, '').slice(0, 80);
  const naam  = String(b.naam || 'foto.jpg').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 60);
  const data  = String(b.data || '');
  if (!groep) return json({ ok: false, error: 'groep' });

  const m = data.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!m) return json({ ok: false, error: 'formaat' });

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 6 * 1024 * 1024) return json({ ok: false, error: 'groot' });

  try {
    const store = getStore('eifotos');
    const key = groep + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + naam;
    await store.set(key, buf, {
      metadata: { groep, naam, door, op: new Date().toISOString() }
    });
    return json({ ok: true, key });
  } catch (e) {
    console.log('blob-upload-fout', String(e));
    return json({ ok: false, error: 'opslag: ' + String(e && e.message ? e.message : e).slice(0, 120) });
  }
};
