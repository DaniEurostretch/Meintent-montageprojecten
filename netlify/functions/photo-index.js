// Overzicht van ALLE toegevoegde foto's (voor de terughaal-actie op de pc).
// Geeft per foto de groep, de bestandsnaam en de download-URL terug.
exports.handler = async () => {
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('eifotos');

    let archief = [];
    try {
      const a = await store.get('archief.json', { type: 'json' });
      if (a && Array.isArray(a.keys)) archief = a.keys;
    } catch (e) {}

    const res = await store.list();
    const blobs = (res && res.blobs ? res.blobs : []).filter(b => b.key !== 'archief.json');
    const items = [];
    for (const b of blobs) {
      if (archief.indexOf(b.key) >= 0) continue;
      const slash = b.key.indexOf('/');
      const groep = slash > 0 ? b.key.slice(0, slash) : '';
      const rest = slash > 0 ? b.key.slice(slash + 1) : b.key;
      // naam: <tijd>-<random>-<origineel>
      const parts = rest.split('-');
      const naam = parts.length > 2 ? parts.slice(2).join('-') : rest;
      items.push({
        key: b.key,
        groep: groep,
        naam: naam,
        url: '/.netlify/functions/photo-get?key=' + encodeURIComponent(b.key)
      });
    }
    items.sort((x, y) => (x.groep + x.key).localeCompare(y.groep + y.key));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true, aantal: items.length, fotos: items })
    };
  } catch (e) {
    console.log('blob-index-fout', String(e));
    return { statusCode: 200, body: JSON.stringify({ ok: false, aantal: 0, fotos: [] }) };
  }
};
