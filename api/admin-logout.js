import { clearSessionCookie, json } from './_utils.js';

export async function POST() {
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}
