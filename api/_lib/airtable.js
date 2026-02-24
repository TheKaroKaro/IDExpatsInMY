// Common Airtable helpers for Vercel functions (Node 18+)
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

if (!BASE_ID || !API_KEY) {
  console.warn("Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY env vars.");
}

async function at(method, path, body) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function list(table, params = {}) {
  const usp = new URLSearchParams(params);
  return at("GET", `${encodeURIComponent(table)}?${usp.toString()}`);
}

async function retrieve(table, recordId) {
  return at("GET", `${encodeURIComponent(table)}/${recordId}`);
}

async function create(table, records) {
  return at("POST", `${encodeURIComponent(table)}`, { records });
}

async function update(table, records) {
  return at("PATCH", `${encodeURIComponent(table)}`, { records });
}

module.exports = { list, retrieve, create, update };