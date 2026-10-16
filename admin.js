const pinGate = document.getElementById('pinGate');
const adminApp = document.getElementById('adminApp');
const pinDots = [...document.querySelectorAll('#pinDots span')];
const pinError = document.getElementById('pinError');
const tableBody = document.getElementById('responsesTableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('detailsModal');
const modalContent = document.getElementById('modalContent');
const modalTimestamp = document.getElementById('modalTimestamp');
let enteredPin = ''; let responses = [];

function escapeHTML(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function formatSubmittedDate(iso) { if(!iso)return'غير متوفر'; return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso)); }
function formatAttendanceDate(value) { if(!value)return'غير محدد'; const [y,m,d]=value.split('-').map(Number); if(!y||!m||!d)return escapeHTML(value); return new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium'}).format(new Date(y,m-1,d)); }
function updatePinDots(){ pinDots.forEach((dot,i)=>dot.classList.toggle('filled',i<enteredPin.length)); }
function resetPin(message=''){ enteredPin=''; updatePinDots(); pinError.textContent=message; }

async function loadResponses() {
  const res = await fetch('/api/admin-responses', { credentials:'same-origin' });
  if (res.status === 401) { lockAdmin(false); return false; }
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || 'تعذر تحميل الردود.');
  responses = data.responses || []; renderStats(); renderTable(); return true;
}
async function unlockAdmin() {
  pinGate.classList.add('is-hidden'); adminApp.classList.remove('is-hidden'); adminApp.setAttribute('aria-hidden','false'); document.body.classList.remove('locked');
  try { await loadResponses(); } catch(err) { window.alert(err.message); }
}
async function lockAdmin(callServer=true) {
  closeModal();
  if(callServer) await fetch('/api/admin-logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});
  adminApp.classList.add('is-hidden'); adminApp.setAttribute('aria-hidden','true'); pinGate.classList.remove('is-hidden'); document.body.classList.add('locked'); resetPin();
}
async function submitPinIfReady() {
  if (enteredPin.length !== 4) return;
  try {
    const res = await fetch('/api/admin-login',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({pin:enteredPin})});
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error || 'الرقم السري غير صحيح.');
    pinError.textContent=''; await unlockAdmin();
  } catch(err) {
    document.querySelector('.pin-card').classList.add('shake'); pinError.textContent=err.message;
    setTimeout(()=>{document.querySelector('.pin-card').classList.remove('shake'); resetPin(err.message);},360);
  }
}
document.querySelectorAll('[data-digit]').forEach(button=>button.addEventListener('click',()=>{ if(enteredPin.length>=4)return; enteredPin+=button.dataset.digit; pinError.textContent=''; updatePinDots(); submitPinIfReady(); }));
document.getElementById('backspacePin').addEventListener('click',()=>{enteredPin=enteredPin.slice(0,-1);pinError.textContent='';updatePinDots();});
document.getElementById('clearPin').addEventListener('click',()=>resetPin());
document.getElementById('lockBtn').addEventListener('click',()=>lockAdmin(true));
document.addEventListener('keydown',event=>{ if(!pinGate.classList.contains('is-hidden')){ if(/^[0-9]$/.test(event.key)&&enteredPin.length<4){enteredPin+=event.key;pinError.textContent='';updatePinDots();submitPinIfReady();}else if(event.key==='Backspace'){enteredPin=enteredPin.slice(0,-1);updatePinDots();} return;} if(event.key==='Escape')closeModal(); });
function renderStats(){document.getElementById('responsesCount').textContent=responses.length;document.getElementById('presentTotal').textContent=responses.reduce((s,r)=>s+Number(r.presentCount||0),0);document.getElementById('absentTotal').textContent=responses.reduce((s,r)=>s+Number(r.absentCount||0),0);}
function renderTable(list=responses){tableBody.innerHTML='';document.getElementById('tableCount').textContent=`${list.length} رد`;if(!list.length){emptyState.classList.remove('is-hidden');return;}emptyState.classList.add('is-hidden');list.forEach(response=>{const tr=document.createElement('tr');tr.dataset.id=response.id;tr.innerHTML=`<td data-label="اسم المدرس" class="teacher-cell"><strong>${escapeHTML(response.teacherName)}</strong></td><td data-label="الشعبة">${escapeHTML(response.sectionName)}</td><td data-label="المقرر">${escapeHTML(response.courseName)}</td><td data-label="التاريخ">${formatAttendanceDate(response.attendanceDate)}</td><td data-label="الحصة"><span class="lesson-badge">${escapeHTML(response.lessonNumber||'—')}</span></td><td data-label="الغائبات"><span class="count-badge absent">${Number(response.absentCount||0)}</span></td><td class="row-arrow" aria-hidden="true">←</td>`;tr.addEventListener('click',()=>openDetails(response.id));tableBody.appendChild(tr);});}
function openDetails(id){const response=responses.find(item=>item.id===id);if(!response)return;modalTimestamp.textContent=`تم إرسال السجل في ${formatSubmittedDate(response.submittedAt)}`;const names=Array.isArray(response.absenteeNames)?response.absenteeNames:[];modalContent.innerHTML=`<div class="details-grid"><div class="detail-box"><span>اسم المدرس</span><strong>${escapeHTML(response.teacherName)}</strong></div><div class="detail-box"><span>اسم الشعبة</span><strong>${escapeHTML(response.sectionName)}</strong></div><div class="detail-box"><span>اسم المقرر</span><strong>${escapeHTML(response.courseName)}</strong></div><div class="detail-box"><span>التاريخ</span><strong>${formatAttendanceDate(response.attendanceDate)}</strong></div><div class="detail-box"><span>رقم الحصة</span><strong>${escapeHTML(response.lessonNumber||'غير محدد')}</strong></div><div class="detail-box"><span>إجمالي الطالبات</span><strong>${Number(response.presentCount||0)+Number(response.absentCount||0)}</strong></div><div class="detail-box"><span>عدد الحاضرات</span><strong>${Number(response.presentCount||0)}</strong></div><div class="detail-box"><span>عدد الغائبات</span><strong>${Number(response.absentCount||0)}</strong></div></div>${Number(response.absentCount||0)>0?`<div class="absent-names-card"><h3>أسماء الطالبات الغائبات (${Number(response.absentCount||0)})</h3><div class="names-list">${names.map((name,i)=>`<div class="name-chip"><span>${i+1}</span>${escapeHTML(name)}</div>`).join('')}</div></div>`:`<div class="all-present-card">✓ لا توجد طالبات غائبات في هذا السجل.</div>`}`;modal.classList.remove('is-hidden');document.body.style.overflow='hidden';}
function closeModal(){modal.classList.add('is-hidden');document.body.style.overflow='';}
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',closeModal));
searchInput.addEventListener('input',()=>{const q=searchInput.value.trim().toLowerCase();renderTable(!q?responses:responses.filter(r=>[r.teacherName,r.sectionName,r.courseName,r.attendanceDate,r.lessonNumber].some(v=>String(v??'').toLowerCase().includes(q))));});
document.getElementById('clearBtn').addEventListener('click',async()=>{if(!responses.length)return;if(!window.confirm('هل أنت متأكد من مسح جميع الردود؟ لا يمكن التراجع عن هذه العملية.'))return;const res=await fetch('/api/admin-responses',{method:'DELETE',credentials:'same-origin'});const data=await res.json().catch(()=>({}));if(!res.ok){window.alert(data.error||'تعذر مسح البيانات.');return;}responses=[];renderStats();renderTable();});
document.getElementById('exportBtn').addEventListener('click',()=>{if(!responses.length){window.alert('لا توجد بيانات لتصديرها.');return;}const rows=[['اسم المدرس','الشعبة','المقرر','التاريخ','رقم الحصة','الحاضرات','الغائبات','أسماء الغائبات','وقت الإرسال'],...responses.map(r=>[r.teacherName,r.sectionName,r.courseName,r.attendanceDate||'',r.lessonNumber||'',r.presentCount,r.absentCount,(r.absenteeNames||[]).join(' | '),formatSubmittedDate(r.submittedAt)])];const csv='\uFEFF'+rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`attendance-responses-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url);});
updatePinDots();
// If a valid secure session cookie already exists, skip the keypad.
loadResponses().then(ok=>{if(ok)unlockAdmin();}).catch(()=>{});
