const { list, create, retrieve } = require('./_lib/airtable');
const { ok, bad, checkRateLimit, verifyTurnstile, slugify } = require('./_lib/utils');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return ok(res, { ok: true });

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const slug = url.searchParams.get('slug');
      const featured = url.searchParams.get('featured');
      const limit = url.searchParams.get('limit') || 200;

      if (slug) {
        const articles = await list('Articles', {
          filterByFormula: `AND(Status='Approved',Slug='${slug}')`,
          maxRecords: 1
        });
        return ok(res, { record: articles.records[0] || null });
      }

      if (featured) {
        const featured = await list('Articles', {
          filterByFormula: "AND(Status='Approved',Featured=1)",
          maxRecords: 1
        });
        return ok(res, { record: featured.records[0] || null });
      }

      const articles = await list('Articles', {
        filterByFormula: "Status='Approved'",
        maxRecords: limit,
        sort: [{ field: 'CreatedAt', direction: 'desc' }]
      });

      return ok(res, { records: articles.records });
    }

    if (req.method === 'POST') {
      const body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data || '{}')));
      });

      const valid = await verifyTurnstile(body.turnstileToken);
      if (!valid) return bad(res, 'Verifikasi bot gagal');

      const { title, content, author, category, imageUrl } = body;

      if (!title || !content) {
        return bad(res, 'Judul dan konten wajib diisi');
      }

      const record = {
        fields: {
          Title: title,
          Content: content,
          Author: author || 'Anonymous',
          Category: category || 'Umum',
          ImageURL: imageUrl || '',
          Slug: slugify(title),
          Status: 'Pending',
          Featured: false,
          CreatedAt: new Date().toISOString().split('T')[0]
        }
      };

      const result = await create('Articles', [record]);
      return ok(res, { success: true, id: result.records[0].id });
    }

    return bad(res, 'Method not allowed');
  } catch (error) {
    console.error(error);
    return bad(res, 'Internal server error');
  }
};