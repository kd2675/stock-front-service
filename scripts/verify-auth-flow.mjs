import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildLoginPath, sanitizeAuthNextPath } from "../app/lib/authRouting.ts";

assert.equal(sanitizeAuthNextPath("/trade?symbol=DEMO002"), "/trade?symbol=DEMO002");
assert.equal(sanitizeAuthNextPath("https://attacker.example/steal"), "/");
assert.equal(sanitizeAuthNextPath("//attacker.example/steal"), "/");
assert.equal(sanitizeAuthNextPath("%2F%2Fattacker.example%2Fsteal"), "/");
assert.equal(sanitizeAuthNextPath("/auth/callback"), "/");
assert.equal(sanitizeAuthNextPath("/login?next=/admin"), "/");
assert.equal(buildLoginPath("/admin?tab=market", true), "/login?next=%2Fadmin%3Ftab%3Dmarket&expired=1");

const callbackSource = await readFile(new URL("../app/auth/callback/page.tsx", import.meta.url), "utf8");
const loginSource = await readFile(new URL("../app/login/LoginClient.tsx", import.meta.url), "utf8");
const formSource = await readFile(new URL("../app/login/LoginFormPanel.tsx", import.meta.url), "utf8");

assert.doesNotMatch(callbackSource, /location\.hash|fragment\.get\("token"\)|setAccessToken\(/);
assert.match(callbackSource, /ensureAccessToken\(\)/);
assert.doesNotMatch(loginSource, /searchParams\.get\("token"\)/);
assert.match(loginSource, /authStatus === "unknown"/);
assert.match(loginSource, /window\.location\.replace\(/);
assert.match(formSource, /<form/);
assert.match(formSource, /type="submit"/);

console.log("Stock authentication routing checks passed.");
