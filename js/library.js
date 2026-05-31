/* ════════════════════════════════════════
   OpenQuiz — Library Page (List, Card, Import, Export, Delete)
   ════════════════════════════════════════ */

async function loadLibrary(){
  const quizzes = await getAllQuizzes();
  const grid = document.getElementById('quizGrid');
  if(quizzes.length===0){
    grid.innerHTML=`<div class="quiz-empty">
      <div class="quiz-empty-icon">📭</div>
      <h3>No Quizzes Yet</h3>
      <p>Create your first quiz or import a JSON file to get started.</p>
      <button class="btn btn-primary" style="margin-top:14px" onclick="newQuiz()">✏️ Create Quiz</button>
    </div>`;
    updateLibStats(0,0);
    return;
  }
  quizzes.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));

  // Apply search filter
  const searchVal = (document.getElementById('libSearch')?.value||'').toLowerCase().trim();
  const sortVal = document.getElementById('libSort')?.value||'newest';

  let filtered = quizzes;
  if(searchVal){
    filtered = quizzes.filter(q =>
      (q.title||'').toLowerCase().includes(searchVal) ||
      (q.subject||'').toLowerCase().includes(searchVal) ||
      (q.chapter||'').toLowerCase().includes(searchVal)
    );
  }

  // Sort
  if(sortVal==='newest') filtered.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  else if(sortVal==='oldest') filtered.sort((a,b)=>(a.updatedAt||0)-(b.updatedAt||0));
  else if(sortVal==='alpha') filtered.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
  else if(sortVal==='qcount') filtered.sort((a,b)=>((b.questions||[]).length)-((a.questions||[]).length));

  const totalQs = quizzes.reduce((sum,q)=>sum+(q.questions||[]).length,0);
  updateLibStats(quizzes.length,totalQs);

  if(filtered.length===0){
    grid.innerHTML=`<div class="quiz-empty">
      <div class="quiz-empty-icon">🔍</div>
      <h3>No Results</h3>
      <p>No quizzes match your search.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(q=>renderQuizCard(q)).join('');
}

function updateLibStats(quizCount,qCount){
  const el = document.getElementById('libStats');
  if(!el) return;
  el.innerHTML = `
    <span class="lib-stat">📚 <strong>${quizCount}</strong> Quizzes</span>
    <span class="lib-stat">❓ <strong>${qCount}</strong> Questions</span>
  `;
}

function renderQuizCard(q){
  const scheme = SCHEMES.find(s=>s.id===q.colorScheme)||SCHEMES[0];
  const bannerStyle = q.backdropData
    ? `background-image:url('${q.backdropData}');`
    : `background:${scheme.gradient};`;
  const date = q.updatedAt ? new Date(q.updatedAt).toLocaleDateString() : '';
  return `<div class="quiz-card">
    <div class="quiz-card-banner" style="${bannerStyle}">
      <div class="quiz-card-banner-overlay"></div>
      <span class="quiz-card-icon">${q.icon||'📝'}</span>
    </div>
    <div class="quiz-card-body">
      <div class="quiz-card-title" title="${esc(q.title)}">${esc(q.title||'Untitled')}</div>
      <div class="quiz-card-meta">${q.subject?esc(q.subject)+' · ':''}${q.questions?q.questions.length:0} Qs · ${date}</div>
      <div class="quiz-card-actions">
        <button class="btn btn-ghost btn-sm" onclick="editQuiz('${q.id}')">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="downloadQuizHTMLById('${q.id}')">⬇️ HTML</button>
        <button class="btn btn-ghost btn-sm" onclick="exportQuizJSON('${q.id}')">📤 JSON</button>
        <button class="btn btn-ghost btn-sm" onclick="openVersionHistory('${q.id}')" title="View versions">⏱️</button>
        <button class="btn btn-danger btn-sm" onclick="promptDelete('${q.id}','${esc(q.title||'Untitled')}')">🗑️</button>
      </div>
    </div>
  </div>`;
}

let pendingDeleteId=null;
function promptDelete(id,name){
  pendingDeleteId=id;
  document.getElementById('deleteModalName').textContent=name;
  document.getElementById('deleteModal').classList.remove('hidden');
  document.getElementById('confirmDeleteBtn').onclick=async()=>{
    await deleteVersionsForQuiz(pendingDeleteId);
    await deleteQuizDB(pendingDeleteId);
    closeModal('deleteModal');
    loadLibrary();
    toast('🗑️ Quiz deleted','info');
  };
}

async function clearAllQuizzes(){document.getElementById('clearAllModal').classList.remove('hidden');}
async function confirmClearAll(){
  // Clear both stores
  await clearAllDB();
  const tx=db.transaction(VERSION_STORE,'readwrite');
  const store=tx.objectStore(VERSION_STORE);
  await new Promise((res,rej)=>{const r=store.clear();r.onsuccess=()=>res();r.onerror=e=>rej(e);});
  closeModal('clearAllModal');loadLibrary();toast('🗑️ All quizzes deleted','info');
}

function importQuizFromFile(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json';
  input.onchange=async e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const d=JSON.parse(ev.target.result);
        if(!d.title||!Array.isArray(d.questions)){toast('⚠️ Invalid quiz JSON format','err');return;}
        const quiz={
          id:'q_'+Date.now(),
          title:d.title,subject:d.subject||'',chapter:d.chapter||'',topic:d.topic||'',
          description:d.description||'',timerSeconds:d.timerSeconds||30,author:d.author||'',
          icon:d.icon||'📝',colorScheme:d.colorScheme||'purple',backdropData:null,
          questions:(d.questions||[]).map(q=>({question:q.question||'',options:q.options||['','','',''],correct:typeof q.correct==='number'?q.correct:0,explanation:q.explanation||'',difficulty:q.difficulty||'easy',tags:q.tags||[]})),
          updatedAt:Date.now()
        };
        await putQuiz(quiz);
        loadLibrary();
        toast('✅ Quiz imported from file!','ok');
      }catch(e){toast('❌ Invalid JSON: '+e.message,'err');}
    };
    reader.readAsText(file);
  };
  input.click();
}

async function exportAllQuizzes(){
  const quizzes=await getAllQuizzes();
  if(!quizzes.length){toast('No quizzes to export','info');return;}
  const blob=new Blob([JSON.stringify(quizzes,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='openquiz-all-'+Date.now()+'.json';
  a.click();
  toast('📤 All quizzes exported!','ok');
}

async function exportQuizJSON(id){
  const quizzes=await getAllQuizzes();
  const q=quizzes.find(q=>q.id===id);
  if(!q) return;
  const {id:_id,updatedAt:_u,...data}=q;
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(q.title||'quiz').replace(/[^a-z0-9]/gi,'-').toLowerCase()+'.json';
  a.click();
  toast('📤 JSON exported!','ok');
}

// ═══ Version History ═══
async function openVersionHistory(quizId){
  const versions=await getVersions(quizId);
  const quiz=await getQuiz(quizId);
  if(!quiz){toast('❌ Quiz not found','err');return;}
  document.getElementById('versionModalSub').textContent=quiz.title||'Untitled';
  const list=document.getElementById('versionList');
  if(!versions||versions.length===0){
    list.innerHTML='<div class="version-empty">No versions saved yet. Save the quiz to create the first version.</div>';
  }else{
    versions.sort((a,b)=>b.num-a.num);
    list.innerHTML=versions.map(v=>{
      const d=new Date(v.savedAt).toLocaleString();
      const isCurrent=v.num===(quiz.currentVersion||0);
      return `<div class="version-item${isCurrent?' version-current':''}">
        <div class="version-info">
          <span class="version-num">v${v.num}</span>
          <span class="version-label">${esc(v.label||'Snapshot')}</span>
          <span class="version-date">${d}</span>
          ${isCurrent?'<span class="version-badge">Current</span>':''}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="restoreVersion('${v.id}','${quizId}')"${isCurrent?' disabled':''}>${isCurrent?'✓ Current':'↩ Restore'}</button>
      </div>`;
    }).join('');
  }
  document.getElementById('versionModal').classList.remove('hidden');
}

async function restoreVersion(versionId,quizId){
  const tx=db.transaction(VERSION_STORE,'readonly');
  const req=tx.objectStore(VERSION_STORE).get(versionId);
  req.onsuccess=async e=>{
    const v=e.target.result;
    if(!v){toast('❌ Version not found','err');return;}
    const snap=v.snapshot;
    // Load into builder
    currentEditId=quizId;
    builderState={
      questions:JSON.parse(JSON.stringify(snap.questions||[])),
      icon:snap.icon||'📝',
      colorScheme:snap.colorScheme||'purple',
      backdropData:snap.backdropData||null
    };
    document.getElementById('builderTitle').textContent='✏️ '+snap.title;
    document.getElementById('f-title').value=snap.title||'';
    document.getElementById('f-subject').value=snap.subject||'';
    document.getElementById('f-chapter').value=snap.chapter||'';
    document.getElementById('f-topic').value=snap.topic||'';
    document.getElementById('f-desc').value=snap.description||'';
    document.getElementById('f-timer').value=snap.timerSeconds||30;
    document.getElementById('f-author').value=snap.author||'';
    document.getElementById('headerViewJSON').style.display='';
    document.getElementById('createModeSelector').style.display='none';
    document.getElementById('switchModeBar').classList.remove('hidden');
    document.getElementById('buildProgressWrap').style.display='block';
    document.getElementById('builderTabs').style.display='flex';
    document.getElementById('currentModeLabel').textContent='✏️ Manual';
    document.getElementById('btnViewJSON').classList.remove('hidden');
    document.getElementById('btnBackToManual').classList.add('hidden');
    document.getElementById('btnApplyJSON').style.display='none';
    closeModal('versionModal');
    showPage('builder');
    initStyleGrids();
    renderQuestions();
    updateIconPreview();
    updateProgress();
    if(builderState.backdropData) showBackdropPreview(builderState.backdropData);
    toast('⏱ Restored to v'+v.num,'ok');
  };
  req.onerror=()=>toast('❌ Failed to load version','err');
}

// Library search & sort handlers
function onLibSearch(){
  loadLibrary();
}
function onLibSort(){
  loadLibrary();
}
