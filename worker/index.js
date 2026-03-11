export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const code = (url.searchParams.get('c') || '').toUpperCase().trim();

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    if (!code) {
      return new Response(JSON.stringify({ error: 'missing code' }), { headers });
    }

    const data = await env.CONTACTS.get(code);
    if (!data) {
      return new Response(JSON.stringify({ error: 'not found' }), { headers });
    }

    return new Response(data, { headers });
  },
};
