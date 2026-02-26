const { list, create, update } = require('./_lib/airtable');
const { ok, bad, getIP, sha256, checkRateLimit, verifyTurnstile } = require('./_lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return bad(res, 'Method not allowed');

  try {
    const ip = getIP(req);
    if (!checkRateLimit(ip, 20)) {
      return bad(res, 'Terlalu banyak permintaan');
    }

    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data || '{}')));
    });

    const valid = await verifyTurnstile(body.turnstileToken);
    if (!valid) return bad(res, 'Verifikasi gagal');

    const { serviceId, stars, displayName } = body;
    if (!serviceId || !stars || stars < 1 || stars > 5) {
      return bad(res, 'Data tidak valid');
    }

    // Save rating
    await create('Ratings', [{
      fields: {
        ServiceId: serviceId,
        Stars: Number(stars),
        DisplayName: displayName || 'Anonymous',
        ipHash: sha256(ip),
        CreatedAt: new Date().toISOString()
      }
    }]);

    // Recalculate average
    const ratings = await list('Ratings', {
      filterByFormula: `ServiceId="${serviceId}"`
    });

    const values = ratings.records.map(r => r.fields.Stars || 0);
    const avg = values.length 
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 
      : 0;

    // Update service
    await update('Services', [{
      id: serviceId,
      fields: {
        AverageRating: avg,
        ReviewsCount: values.length
      }
    }]);

    return ok(res, { average: avg, count: values.length });
  } catch (error) {
    console.error(error);
    return bad(res, 'Gagal menyimpan rating');
  }
};