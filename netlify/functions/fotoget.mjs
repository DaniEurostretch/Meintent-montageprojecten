// Levert een toegevoegde foto terug als afbeelding.
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!key) return new Response('geen sleutel', { status: 400 });
  try {
    const store = getStore('eifotos');
    const data = await store.get(key, { type: 'arrayBuffer' });
    if (!data) return new Response('niet gevonden', { status: 404 });
    return new Response(data, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' }
    });
  } catch (e) {
    console.log('blob-get-fout', String(e));
    return new Response('niet gevonden', { status: 404 });
  }
};
