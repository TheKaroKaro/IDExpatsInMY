const { list, create } = require("./_lib/airtable");
const { ok, bad, server, rateLimit, verifyTurnstile, slugify } = require("./_lib/utils");

const ARTICLES = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return ok(res, { ok: true });

  try {
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const slug = url.searchParams.get("slug");
      const featured = url.searchParams.get("featured");

      if (slug) {
        // Single article by slug
        const resp = await list(ARTICLES, {
          filterByFormula: `AND(Status='Approved',Slug='${slug}')`,
          maxRecords: 1
        });
        return ok(res, { record: resp.records[0] || null });
      }

      // list (optionally featured first)
      if (featured) {
        const resp = await list(ARTICLES, {
          filterByFormula: `AND(Status='Approved',Featured=1)`,
          maxRecords: 1,
          sort: [{ field: "CreatedAt", direction: "desc" }]
        });
        return ok(res, { record: resp.records[0] || null });
      }

      const resp = await list(ARTICLES, {
        filterByFormula: `Status='Approved'`,
        maxRecords: 200,
        sort: [{ field: "CreatedAt", direction: "desc" }]
      });
      return ok(res, { records: resp.records });
    }

    if (req.method === "POST") {
      if (!rateLimit(req, res, 10)) return;
      const body = await readJSON(req, res);
      if (!body) return;
      const passed = await verifyTurnstile(body.turnstileToken || "");
      if (!passed) return bad(res, "Bot verification failed.");

      const f = body.fields || {};
      if (!f.Title || !f.Content) return bad(res, "Missing Title or Content");

      const record = {
        Title: String(f.Title).slice(0, 200),
        Content: String(f.Content).slice(0, 10000),
        Author: f.Author ? String(f.Author).slice(0, 120) : "Anonymous",
        ImageURL: f.ImageURL ? String(f.ImageURL) : "",
        Category: f.Category ? String(f.Category).slice(0, 60) : "",
        Featured: !!f.Featured,
        Status: "Pending",
        CreatedAt: new Date().toISOString().split("T")[0],
        Slug: f.Slug ? String(f.Slug).slice(0, 200) : slugify(f.Title)
      };

      const resp = await create(ARTICLES, [{ fields: record }]);
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