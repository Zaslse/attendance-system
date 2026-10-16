import { getSupabaseAdmin, isAdmin, json } from './_utils.js';

function mapRow(row) {
  return {
    id: row.id,
    teacherName: row.teacher_name,
    sectionName: row.section_name,
    courseName: row.course_name,
    attendanceDate: row.attendance_date,
    lessonNumber: row.lesson_number,
    presentCount: row.present_count,
    absentCount: row.absent_count,
    absenteeNames: row.absentee_names || [],
    submittedAt: row.submitted_at
  };
}

export async function GET(request) {
  if (!isAdmin(request)) return json({ error: 'غير مصرح.' }, 401);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('attendance_responses')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error(error);
    return json({ error: 'تعذر تحميل الردود.' }, 500);
  }
  return json({ responses: (data || []).map(mapRow) });
}

export async function DELETE(request) {
  if (!isAdmin(request)) return json({ error: 'غير مصرح.' }, 401);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('attendance_responses')
    .delete()
    .not('id', 'is', null);
  if (error) {
    console.error(error);
    return json({ error: 'تعذر مسح البيانات.' }, 500);
  }
  return json({ ok: true });
}
