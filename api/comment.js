const { create } = require("./_lib/airtable");
const { ok, bad, server, rateLimit, verifyTurnstile } = require("./_lib/utils");

const COMMENTS = process.env.AIRTABLE_COMMENTS_TABLE || "Comments";

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return ok(res, { ok: true });
  if (req.method !== "POST") return bad(res, "Method not allowed");
  try {
    if (!rateLimit(req, res, 20)) return;

    const body = await readJSON(req, res);
    if (!body) return;

    const passed = await verifyTurnstile(body.turnstileToken || "");
    if (!passed) return bad(res, "Bot verification failed.");

    const { contactId, displayName, comment } = body;
    if (!contactId || !displayName || !comment) return bad(res, "Missing fields.");

    await create(COMMENTS, [
      {
        fields: {
          ContactId: String(contactId),
          DisplayName: String(displayName).slice(0, 120),
          Comment: String(comment).slice(0, 3000),
          Status: "Pending",
          CreatedAt: new Date().toISOString()
        }
      }
    ]);

    return ok(res, { ok: true, message: "Submitted and pending approval." });
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