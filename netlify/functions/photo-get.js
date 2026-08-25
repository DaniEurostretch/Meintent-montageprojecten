// Levert een toegevoegde foto uit de opslag terug als afbeelding.
exports.handler = async (event) => {
  const key = String((event.queryStringParameters || {}).key || '');
  if (!key) return { statusCode: 400, body: 'geen sleutel' };
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('eifotos');
    const res = await store.get(key, { type: 'arrayBuffer' });
    if (!res) return { statusCode: 404, body: 'niet gevonden' };
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
      body: Buffer.from(res).toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    console.log('blob-get-fout', String(e));
    return { statusCode: 404, body: 'niet gevonden' };
  }
};
