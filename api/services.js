const { list, create, retrieve } = require('./_lib/airtable');
const { ok, bad, getIP, checkRateLimit, verifyTurnstile } = require('./_lib/utils');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return ok(res, { ok: true });

  try {
    // GET services
    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get('id');
      const limit = url.searchParams.get('limit') || 200;

      if (id) {
        const service = await retrieve('Services', id);
        return ok(res, { record: service });
      }

      const services = await list('Services', {
        filterByFormula: "Status='Approved'",
        maxRecords: limit,
        sort: [{ field: 'CreatedAt', direction: 'desc' }]
      });

      return ok(res, { records: services.records });
    }

    // POST new service
    if (req.method === 'POST') {
      const ip = getIP(req);
      if (!checkRateLimit(ip, 10)) {
        return bad(res, 'Terlalu banyak permintaan. Silakan tunggu.');
      }

      const body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data || '{}')));
      });

      // Verify Turnstile
      const valid = await verifyTurnstile(body.turnstileToken);
      if (!valid) return bad(res, 'Verifikasi bot gagal');

      const { name, category, phone, whatsapp, area, address, description, submittedBy } = body;

      if (!name || !category || !phone || !description || !submittedBy) {
        return bad(res, 'Semua field wajib harus diisi');
      }

      const record = {
        fields: {
          Name: name,
          Category: category,
          Phone: phone,
          WhatsApp: whatsapp || '',
          Area: area || '',
          Address: address || '',
          Description: description,
          SubmittedBy: submittedBy,
          Status: 'Pending',
          AverageRating: 0,
          ReviewsCount: 0,
          CreatedAt: new Date().toISOString().split('T')[0]
        }
      };

      const result = await create('Services', [record]);
      return ok(res, { success: true, id: result.records[0].id });
    }

    return bad(res, 'Method not allowed');
  } catch (error) {
    console.error(error);
    return bad(res, 'Internal server error');
  }
};