import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const COOKIE_NAME = 'attendance_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are missing.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function sign(value) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is missing.');
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function makeSessionCookie() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = String(expires);
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function getCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

export function isAdmin(request) {
  try {
    const token = getCookie(request, COOKIE_NAME);
    if (!token) return false;
    const [expires, signature] = token.split('.');
    if (!expires || !signature) return false;
    if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
    const expected = sign(expires);
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function readJson(request) {
  try { return await request.json(); }
  catch { return null; }
}
