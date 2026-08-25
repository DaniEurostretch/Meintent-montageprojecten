// Geeft de door gebruikers toegevoegde foto's van één groep terug (nieuwste eerst).
exports.handler = async (event) => {
  const groep = String((event.queryStringParameters || {}).groep || '');
  if (!groep) return { statusCode: 200, body: JSON.stringify({ ok: true, fotos: [] }) };
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('eifotos');

    // Gearchiveerde foto's (al opgeslagen in de OneDrive-map) niet meer tonen.
    let archief = [];
    try {
      const a = await store.get('archief.json', { type: 'json' });
      if (a && Array.isArray(a.keys)) archief = a.keys;
    } catch (e) {}

    const res = await store.list({ prefix: groep + '/' });
    const keys = (res && res.blobs ? res.blobs : []).map(b => b.key).filter(k => archief.indexOf(k) < 0);
    keys.sort().reverse();
    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true, fotos: keys.map(k => '/.netlify/functions/photo-get?key=' + encodeURIComponent(k)) })
    };
  } catch (e) {
    console.log('blob-list-fout', String(e));
    return { statusCode: 200, body: JSON.stringify({ ok: true, fotos: [] }) };
  }
};
