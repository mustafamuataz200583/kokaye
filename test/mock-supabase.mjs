// LOCAL TEST ONLY — minimal stand-in for Supabase Auth (GoTrue) + Storage,
// so the admin login and image upload flows can be exercised end-to-end.
import http from "node:http";
import crypto from "node:crypto";

const SECRET = "local-test-jwt-secret";
const users = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", email: "owner@kokaye.test", password: "Kokaye!Test2026" },
  { id: "aaaaaaaa-0000-4000-8000-000000000002", email: "customer@kokaye.test", password: "NotAdmin!2026" },
];
const files = new Map();
const revoked = new Set();
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function jwt(user) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64({ alg: "HS256", typ: "JWT" });
  const p = b64({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", iat: now, exp: now + 3600, session_id: crypto.randomUUID() });
  const s = crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}
function verify(token) {
  if (!token || revoked.has(token)) return null;
  const [h, p, s] = token.split(".");
  if (!s || crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url") !== s) return null;
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  if (claims.exp < Date.now() / 1000) return null;
  return users.find((u) => u.id === claims.sub) ?? null;
}
const userObj = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
const session = (u) => {
  const t = jwt(u);
  return { access_token: t, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: crypto.randomUUID(), user: userObj(u) };
};
const refreshTokens = new Map();

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const json = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
    const bearer = (req.headers.authorization || "").replace(/^Bearer /, "");

    if (url.pathname === "/auth/v1/token") {
      const data = JSON.parse(body.toString() || "{}");
      if (url.searchParams.get("grant_type") === "password") {
        const u = users.find((x) => x.email === data.email && x.password === data.password);
        if (!u) return json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
        const s = session(u); refreshTokens.set(s.refresh_token, u); return json(200, s);
      }
      if (url.searchParams.get("grant_type") === "refresh_token") {
        const u = refreshTokens.get(data.refresh_token);
        if (!u) return json(400, { error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
        const s = session(u); refreshTokens.set(s.refresh_token, u); return json(200, s);
      }
    }
    if (url.pathname === "/auth/v1/user" && req.method === "GET") {
      const u = verify(bearer);
      return u ? json(200, userObj(u)) : json(401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    }
    if (url.pathname === "/auth/v1/logout") { revoked.add(bearer); res.writeHead(204); return res.end(); }

    if (url.pathname.startsWith("/storage/v1/object/public/")) {
      const key = url.pathname.replace("/storage/v1/object/public/", "");
      const f = files.get(key);
      if (!f) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "content-type": f.type, "cache-control": "public, max-age=3600" }); return res.end(f.data);
    }
    if (url.pathname.startsWith("/storage/v1/object/") && req.method === "POST") {
      if (bearer !== "test-service-role-key") return json(403, { error: "Unauthorized" });
      const key = url.pathname.replace("/storage/v1/object/", "");
      files.set(key, { type: req.headers["content-type"], data: body });
      return json(200, { Key: key });
    }
    json(404, { error: "not_found", path: url.pathname });
  })
  .listen(54321, () => console.log("mock supabase on :54321"));
