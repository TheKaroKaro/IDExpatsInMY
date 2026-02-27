const crypto = require('crypto');

function json(res, status, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function ok(res, data) { json(res, 200, data); }
function bad(res, msg) { json(res, 400, { error: msg }); }

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.socket?.remoteAddress || '0.0.0.0';
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Simple in-memory rate limiting
const rateLimit = new Map();
function checkRateLimit(ip, limit = 30) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  
  const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
  timestamps.push(now);
  rateLimit.set(ip, timestamps);
  
  return timestamps.length <= limit;
}

async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true;
  
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

function slugify(text) {
  return text.toString().toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { ok, bad, getIP, sha256, checkRateLimit, verifyTurnstile, slugify };