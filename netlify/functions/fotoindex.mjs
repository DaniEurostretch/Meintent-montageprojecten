// Overzicht van alle toegevoegde foto's (voor de terughaal-actie op de pc).
import { getStore } from '@netlify/blobs';

export default async () => {
  const hdr = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  try {
    const store = getStore('eifotos');
    const res = await store.list();
    const items = [];
    for (const b of (res?.blobs || [])) {
      if (b.key === 'archief.json') continue;
      const i = b.key.indexOf('/');
      const groep = i > 0 ? b.key.slice(0, i) : '';
      const rest = i > 0 ? b.key.slice(i + 1) : b.key;
      const p = rest.split('-');
      const naam = p.length > 2 ? p.slice(2).join('-') : rest;
      items.push({ key: b.key, groep, naam, url: '/.netlify/functions/fotoget?key=' + encodeURIComponent(b.key) });
    }
    items.sort((x, y) => (x.groep + x.key).localeCompare(y.groep + y.key));
    return new Response(JSON.stringify({ ok: true, aantal: items.length, fotos: items }), { headers: hdr });
  } catch (e) {
    console.log('blob-index-fout', String(e));
    return new Response(JSON.stringify({ ok: false, fout: String(e?.message || e).slice(0, 200), aantal: 0, fotos: [] }), { headers: hdr });
  }
};
