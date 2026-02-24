const { list, create, update, retrieve } = require("./_lib/airtable");
const { ok, bad, server, getIP, sha256, rateLimit, verifyTurnstile } = require("./_lib/utils");

const CONTACTS = process.env.AIRTABLE_CONTACTS_TABLE || "Contacts";
const RATINGS = process.env.AIRTABLE_RATINGS_TABLE || "Ratings";

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return ok(res, { ok: true });

  try {
    // GET list or one
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (id) {
        const rec = await retrieve(CONTACTS, id);
        // fetch ratings for this contact to compute avg + count
        const ratings = await list(RATINGS, { filterByFormula: `ContactId="${id}"`, maxRecords: 200 });
        const stars = ratings.records.map(r => r.fields.Stars || 0);
        const avg = stars.length ? (stars.reduce((a, b) => a + b, 0) / stars.length) : 0;
        const rounded = Math.round(avg * 10) / 10;
        return ok(res, {
          record: rec,
          rating: { average: rounded, count: stars.length }
        });
      }

      // List approved contacts
      const resp = await list(CONTACTS, {
        filterByFormula: `Status='Approved'`,
        maxRecords: 200,
        sort: [{ field: "CreatedAt", direction: "desc" }]
      });

      return ok(res, { records: resp.records });
    }

    // POST create new contact (Pending)
    if (req.method === "POST") {
      if (!rateLimit(req, res, 20)) return;
      const body = await readJSON(req, res);
      if (!body) return;

      // Turnstile verification (if token present or secret configured)
      const passed = await verifyTurnstile(body.turnstileToken || "");
      if (!passed) return bad(res, "Bot verification failed.");

      const fields = body.fields || {};
      if (!fields.Name || !fields.Category || !fields.Description || !fields.SubmittedBy) {
        return bad(res, "Missing required fields.");
      }

      const record = {
        Name: String(fields.Name).slice(0, 120),
        Category: String(fields.Category).slice(0, 60),
        Phone: fields.Phone ? String(fields.Phone).slice(0, 60) : "",
        WhatsApp: fields.WhatsApp ? String(fields.WhatsApp).slice(0, 60) : "",
        Address: fields.Address ? String(fields.Address).slice(0, 500) : "",
        Description: String(fields.Description).slice(0, 2000),
        Area: fields.Area ? String(fields.Area).slice(0, 120) : "",
        SubmittedBy: String(fields.SubmittedBy).slice(0, 120),
        Status: "Pending",
        CreatedAt: new Date().toISOString().split("T")[0],
        AverageRating: 0,
        ReviewsCount: 0
      };

      const resp = await create(CONTACTS, [{ fields: record }]);
      return ok(res, { ok: true, record: resp.records[0] });
    }

    return bad(res, "Unsupported method");
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