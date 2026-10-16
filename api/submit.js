import { getSupabaseAdmin, json, readJson } from './_utils.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return json({ error: 'بيانات غير صالحة.' }, 400);

  const teacherName = String(body.teacherName || '').trim();
  const sectionName = String(body.sectionName || '').trim();
  const courseName = String(body.courseName || '').trim();
  const attendanceDate = String(body.attendanceDate || '').trim();
  const lessonNumber = Number(body.lessonNumber);
  const presentCount = Number(body.presentCount);
  const absentCount = Number(body.absentCount);
  const absenteeNames = Array.isArray(body.absenteeNames)
    ? body.absenteeNames.map(v => String(v).trim()).filter(Boolean)
    : [];

  if (!teacherName || !sectionName || !courseName || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    return json({ error: 'يرجى استكمال بيانات الحصة.' }, 400);
  }
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1 ||
      !Number.isInteger(presentCount) || presentCount < 0 ||
      !Number.isInteger(absentCount) || absentCount < 0) {
    return json({ error: 'تأكد من رقم الحصة وأعداد الحضور والغياب.' }, 400);
  }
  if (absenteeNames.length !== absentCount) {
    return json({ error: `يجب إدخال ${absentCount} أسماء للغائبات.` }, 400);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('attendance_responses').insert({
    teacher_name: teacherName,
    section_name: sectionName,
    course_name: courseName,
    attendance_date: attendanceDate,
    lesson_number: lessonNumber,
    present_count: presentCount,
    absent_count: absentCount,
    absentee_names: absenteeNames
  });

  if (error) {
    console.error(error);
    return json({ error: 'تعذر حفظ السجل. حاول مرة أخرى.' }, 500);
  }
  return json({ ok: true }, 201);
}

export function GET() {
  return json({ error: 'Method not allowed' }, 405);
}
