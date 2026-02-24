const crypto = require("crypto");

function json(res, status, data, cors = true) {
  if (cors) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function ok(res, data) { json(res, 200, data); }
function bad(res, msg) { json(res, 400, { error: msg }); }
function server(res, msg) { json(res, 500, { error: msg || "Server error" }); }

function getIP(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.headers["cf-connecting-ip"] ||
    req.socket?.remoteAddress ||
    "0.0.0.0"
  );
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Lightweight rate limit per IP + path (memory-only)
const memoryHits = new Map();
function rateLimit(req, res, limitPerMinute = 30) {
  const key = `${getIP(req)}:${req.url}`;
  const now = Date.now();
  const arr = memoryHits.get(key)?.filter(ts => now - ts < 60_000) || [];
  arr.push(now);
  memoryHits.set(key, arr);
  if (arr.length > limitPerMinute) return bad(res, "Too many requests. Please slow down.");
  return true;
}

async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // soft bypass if not configured yet
  try {
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token })
    });
    const data = await verifyRes.json();
    return !!data.success;
  } catch (_) {
    return false;
  }
}

function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { ok, bad, server, getIP, sha256, rateLimit, verifyTurnstile, slugify };