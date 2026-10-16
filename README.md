# نظام تسجيل الحضور - نسخة النشر

نسخة جاهزة للنشر على Vercel مع تخزين البيانات في Supabase.

## الحماية
- لا يوجد PIN داخل كود المتصفح.
- تسجيل دخول الإدارة يتحقق منه على Vercel Function.
- جلسة الإدارة محفوظة في HttpOnly cookie.
- مفتاح Supabase السري يبقى في Environment Variables على Vercel.
- قاعدة البيانات لا تسمح للـ anon/authenticated بالقراءة أو الكتابة مباشرة.

## Environment Variables المطلوبة على Vercel
- SUPABASE_URL
- SUPABASE_SECRET_KEY
- ADMIN_PIN=8966
- SESSION_SECRET (قيمة عشوائية طويلة)

## قاعدة البيانات
نفّذ محتوى `database.sql` في Supabase SQL Editor.
