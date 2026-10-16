const form = document.getElementById('attendanceForm');
const absentCountInput = document.getElementById('absentCount');
const presentCountInput = document.getElementById('presentCount');
const lessonNumberInput = document.getElementById('lessonNumber');
const attendanceDateInput = document.getElementById('attendanceDate');
const absenteesSection = document.getElementById('absenteesSection');
const absenteeInputs = document.getElementById('absenteeInputs');
const absenteeCounter = document.getElementById('absenteeCounter');
const totalStudents = document.getElementById('totalStudents');
const formStatus = document.getElementById('formStatus');
const toast = document.getElementById('successToast');
const submitBtn = document.getElementById('submitBtn');

function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function intValue(input) {
  const value = Number.parseInt(input.value, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
function updateTotal() {
  totalStudents.textContent = intValue(presentCountInput) + intValue(absentCountInput);
  updateFormStatus();
}
function buildAbsenteeInputs() {
  const count = intValue(absentCountInput);
  const previousValues = [...absenteeInputs.querySelectorAll('input')].map(input => input.value);
  absenteeInputs.innerHTML = '';
  if (count > 0) {
    absenteesSection.classList.remove('is-hidden');
    for (let i = 0; i < count; i += 1) {
      const wrapper = document.createElement('div'); wrapper.className = 'absentee-item';
      const index = document.createElement('span'); index.className = 'index'; index.textContent = i + 1;
      const input = document.createElement('input'); input.type = 'text'; input.className = 'absentee-name';
      input.placeholder = `اسم الطالبة الغائبة ${i + 1}`; input.setAttribute('aria-label', `اسم الطالبة الغائبة ${i + 1}`);
      input.value = previousValues[i] || '';
      wrapper.append(index, input); absenteeInputs.appendChild(wrapper);
    }
  } else { absenteesSection.classList.add('is-hidden'); }
  absenteeInputs.querySelectorAll('.absentee-name').forEach(input => input.addEventListener('input', () => {
    input.classList.remove('invalid'); document.getElementById('absenteesError').textContent = '';
    updateAbsenteeCounter(); updateFormStatus();
  }));
  updateAbsenteeCounter(); updateFormStatus();
}
function updateAbsenteeCounter() {
  const expected = intValue(absentCountInput);
  const completed = [...absenteeInputs.querySelectorAll('.absentee-name')].filter(input => input.value.trim()).length;
  absenteeCounter.textContent = `${completed} / ${expected}`;
}
function updateFormStatus() {
  const required = ['teacherName','sectionName','courseName','attendanceDate','lessonNumber','presentCount','absentCount']
    .map(id => document.getElementById(id));
  const basicComplete = required.every(input => input.value.trim() !== '');
  const absentCount = intValue(absentCountInput);
  const namesComplete = absentCount === 0 || [...absenteeInputs.querySelectorAll('.absentee-name')].filter(i => i.value.trim()).length === absentCount;
  formStatus.textContent = basicComplete && namesComplete ? 'جاهز للإرسال' : 'بانتظار الاكتمال';
  formStatus.className = basicComplete && namesComplete ? 'status-ready' : 'status-pending';
}
function setError(id, message) {
  document.getElementById(id)?.classList.add('invalid');
  const error = document.getElementById(`${id}Error`); if (error) error.textContent = message;
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
}
function validateForm() {
  clearErrors(); let valid = true;
  const values = {
    teacherName: document.getElementById('teacherName').value.trim(),
    sectionName: document.getElementById('sectionName').value.trim(),
    courseName: document.getElementById('courseName').value.trim(),
    attendanceDate: attendanceDateInput.value.trim(),
    lesson: lessonNumberInput.value.trim(), present: presentCountInput.value.trim(), absent: absentCountInput.value.trim()
  };
  if (!values.teacherName) { setError('teacherName','يرجى إدخال اسم المدرس.'); valid=false; }
  if (!values.sectionName) { setError('sectionName','يرجى إدخال اسم الشعبة.'); valid=false; }
  if (!values.courseName) { setError('courseName','يرجى إدخال اسم المقرر.'); valid=false; }
  if (!values.attendanceDate) { setError('attendanceDate','يرجى اختيار التاريخ.'); valid=false; }
  if (values.lesson==='' || Number(values.lesson)<1 || !Number.isInteger(Number(values.lesson))) { setError('lessonNumber','يرجى إدخال رقم حصة صحيح يبدأ من 1.'); valid=false; }
  if (values.present==='' || Number(values.present)<0 || !Number.isInteger(Number(values.present))) { setError('presentCount','يرجى إدخال عدد صحيح للحاضرات.'); valid=false; }
  if (values.absent==='' || Number(values.absent)<0 || !Number.isInteger(Number(values.absent))) { setError('absentCount','يرجى إدخال عدد صحيح للغائبات.'); valid=false; }
  const absentCount = intValue(absentCountInput);
  const names = [...absenteeInputs.querySelectorAll('.absentee-name')];
  if (absentCount > 0 && names.filter(i => i.value.trim()).length !== absentCount) {
    document.getElementById('absenteesError').textContent = `يجب إدخال ${absentCount} أسماء كاملة، بما يطابق عدد الغائبات.`;
    names.forEach(i => { if (!i.value.trim()) i.classList.add('invalid'); }); valid=false;
  }
  return valid;
}
function resetFormAfterSubmit() {
  form.reset(); attendanceDateInput.value = localISODate(); buildAbsenteeInputs(); updateTotal(); clearErrors();
}
absentCountInput.addEventListener('input', () => { buildAbsenteeInputs(); updateTotal(); });
presentCountInput.addEventListener('input', updateTotal);
['teacherName','sectionName','courseName','attendanceDate','lessonNumber','presentCount','absentCount'].forEach(id => {
  document.getElementById(id).addEventListener('input', event => {
    event.target.classList.remove('invalid'); const error=document.getElementById(`${id}Error`); if(error) error.textContent=''; updateFormStatus();
  });
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!validateForm()) {
    document.querySelector('.invalid')?.scrollIntoView({ behavior:'smooth', block:'center' }); return;
  }
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true; submitBtn.innerHTML = '<span>جارٍ الإرسال...</span>';
  const payload = {
    teacherName: document.getElementById('teacherName').value.trim(),
    sectionName: document.getElementById('sectionName').value.trim(),
    courseName: document.getElementById('courseName').value.trim(),
    attendanceDate: attendanceDateInput.value,
    lessonNumber: Number.parseInt(lessonNumberInput.value,10),
    presentCount: intValue(presentCountInput), absentCount: intValue(absentCountInput),
    absenteeNames: [...absenteeInputs.querySelectorAll('.absentee-name')].map(i=>i.value.trim()).filter(Boolean)
  };
  try {
    const res = await fetch('/api/submit', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || 'تعذر الإرسال.');
    resetFormAfterSubmit(); toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),3200);
  } catch (err) { window.alert(err.message || 'تعذر الإرسال. حاول مرة أخرى.'); }
  finally { submitBtn.disabled = false; submitBtn.innerHTML = originalText; }
});
attendanceDateInput.value = localISODate(); buildAbsenteeInputs(); updateTotal();
