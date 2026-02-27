const { create } = require('./_lib/airtable');
const { ok, bad, checkRateLimit, verifyTurnstile } = require('./_lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return bad(res, 'Method not allowed');

  try {
    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data || '{}')));
    });

    const valid = await verifyTurnstile(body.turnstileToken);
    if (!valid) return bad(res, 'Verifikasi gagal');

    const { serviceId, displayName, comment } = body;
    if (!serviceId || !displayName || !comment) {
      return bad(res, 'Semua field wajib diisi');
    }

    await create('Comments', [{
      fields: {
        ServiceId: serviceId,
        DisplayName: displayName,
        Comment: comment,
        Status: 'Pending',
        CreatedAt: new Date().toISOString()
      }
    }]);

    return ok(res, { success: true });
  } catch (error) {
    console.error(error);
    return bad(res, 'Gagal menyimpan komentar');
  }
};