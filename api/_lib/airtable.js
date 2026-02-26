const BASE_ID = process.env.AIRTABLE_BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

async function request(method, path, body = null) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Airtable error: ${error}`);
  }
  return res.json();
}

async function list(table, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request('GET', `${encodeURIComponent(table)}?${query}`);
}

async function create(table, records) {
  return request('POST', encodeURIComponent(table), { records });
}

async function update(table, records) {
  return request('PATCH', encodeURIComponent(table), { records });
}

async function retrieve(table, id) {
  return request('GET', `${encodeURIComponent(table)}/${id}`);
}

module.exports = { list, create, update, retrieve };