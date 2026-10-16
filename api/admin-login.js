import { json, makeSessionCookie, readJson } from './_utils.js';

export async function POST(request) {
  const body = await readJson(request);
  const pin = String(body?.pin || '');
  const expected = String(process.env.ADMIN_PIN || '');
  if (!expected) return json({ error: 'إعدادات الإدارة غير مكتملة.' }, 500);
  if (pin !== expected) return json({ error: 'الرقم السري غير صحيح.' }, 401);
  return json({ ok: true }, 200, { 'set-cookie': makeSessionCookie() });
}
