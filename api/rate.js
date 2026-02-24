const { list, create, update } = require("./_lib/airtable");
const { ok, bad, server, getIP, sha256, rateLimit, verifyTurnstile } = require("./_lib/utils");

const CONTACTS = process.env.AIRTABLE_CONTACTS_TABLE || "Contacts";
const RATINGS = process.env.AIRTABLE_RATINGS_TABLE || "Ratings";

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return ok(res, { ok: true });
  if (req.method !== "POST") return bad(res, "Method not allowed");

  try {
    if (!rateLimit(req, res, 30)) return;

    const body = await readJSON(req, res);
    if (!body) return;

    const passed = await verifyTurnstile(body.turnstileToken || "");
    if (!passed) return bad(res, "Bot verification failed.");

    const { contactId, stars, displayName, deviceHash } = body;
    if (!contactId || !stars || stars < 1 || stars > 5) return bad(res, "Invalid input");

    const ip = getIP(req);
    const ipHash = sha256(ip);

    // Save rating
    await create(RATINGS, [
      {
        fields: {
          ContactId: contactId,
          Stars: Number(stars),
          DisplayName: displayName ? String(displayName).slice(0, 120) : "",
          ipHash,
          deviceHash: deviceHash ? String(deviceHash).slice(0, 120) : "",
          CreatedAt: new Date().toISOString()
        }
      }
    ]);

    // Recalculate average & count, then update contact
    const ratings = await list(RATINGS, { filterByFormula: `ContactId="${contactId}"`, maxRecords: 500 });
    const arr = ratings.records.map(r => r.fields.Stars || 0);
    const avg = arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const rounded = Math.round(avg * 10) / 10;

    await update(CONTACTS, [
      { id: contactId, fields: { AverageRating: rounded, ReviewsCount: arr.length } }
    ]);

    return ok(res, { ok: true, average: rounded, count: arr.length });
  } catch (err) {
    console.error(err);
    return server(res, err.message);
  }
};

async function readJSON(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf-8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    bad(res, "Invalid JSON");
    return null;
  }
}