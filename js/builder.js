/* ════════════════════════════════════════
   OpenQuiz — Quiz Builder
   ════════════════════════════════════════ */

let builderState = {
  questions:[],
  icon:'📝',
  colorScheme:'purple',
  backdropData:null
};
let dragSrcIdx = null;
let styleInited = false;

function newQuiz(){
  currentEditId = null;
  builderState = {questions:[],icon:'📝',colorScheme:'purple',backdropData:null};
  clearBuilderForm();
  document.getElementById('builderTitle').textContent = '✏️ New Quiz';
  switchBTab('info');
  showPage('builder');
  initStyleGrids();
}

async function editQuiz(id){
  const quizzes = await getAllQuizzes();
  const q = quizzes.find(q=>q.id===id);
  if(!q) return;
  currentEditId = id;
  builderState = {
    questions: JSON.parse(JSON.stringify(q.questions||[])),
    icon: q.icon||'📝',
    colorScheme: q.colorScheme||'purple',
    backdropData: q.backdropData||null
  };
  document.getElementById('builderTitle').textContent = '✏️ Edit Quiz';
  document.getElementById('f-title').value = q.title||'';
  document.getElementById('f-subject').value = q.subject||'';
  document.getElementById('f-chapter').value = q.chapter||'';
  document.getElementById('f-topic').value = q.topic||'';
  document.getElementById('f-desc').value = q.description||'';
  document.getElementById('f-timer').value = q.timerSeconds||30;
  document.getElementById('f-author').value = q.author||'';
  switchBTab('info');
  showPage('builder');
  initStyleGrids();
  renderQuestions();
  updateIconPreview();
  updateProgress();
  if(builderState.backdropData) showBackdropPreview(builderState.backdropData);
}

function clearBuilderForm(){
  ['f-title','f-subject','f-chapter','f-topic','f-desc','f-author'].forEach(id=>{
    document.getElementById(id).value='';
  });
  document.getElementById('f-timer').value=30;
  document.getElementById('f-icon').value='📝';
  document.getElementById('iconPreview').textContent='📝';
  clearBackdrop();
  renderQuestions();
  updateProgress();
}

function switchBTab(tab){
  ['info','questions','style','import','preview'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('hidden',t!==tab);
    document.getElementById('btab-'+t).classList.toggle('active',t===tab);
  });
  if(tab==='preview') buildPreview();
  if(tab==='style') initStyleGrids();
}

// ═══ QUESTIONS ═══
function addQuestion(){
  builderState.questions.push({
    question:'',options:['','','',''],correct:0,explanation:'',difficulty:'easy',tags:[]
  });
  renderQuestions();
  updateProgress();
  setTimeout(()=>{
    const items=document.querySelectorAll('.q-item');
    if(items.length) openQItem(items[items.length-1]);
    switchBTab('questions');
  },50);
}

function removeQuestion(idx){
  builderState.questions.splice(idx,1);
  renderQuestions();
  updateProgress();
}

function renderQuestions(){
  const list = document.getElementById('q-list');
  const empty = document.getElementById('q-empty');
  const badge = document.getElementById('qcount-badge');
  badge.textContent = builderState.questions.length;
  if(builderState.questions.length===0){
    list.innerHTML='';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  list.innerHTML = builderState.questions.map((q,i)=>renderQItem(q,i)).join('');
  list.querySelectorAll('.q-item').forEach((el,i)=>{
    el.setAttribute('draggable','true');
    el.addEventListener('dragstart',e=>{dragSrcIdx=i;el.classList.add('dragging');});
    el.addEventListener('dragend',e=>{el.classList.remove('dragging');document.querySelectorAll('.q-item').forEach(x=>x.classList.remove('drag-over'));});
    el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over');});
    el.addEventListener('drop',e=>{
      e.preventDefault();el.classList.remove('drag-over');
      if(dragSrcIdx!==null&&dragSrcIdx!==i){
        const moved=builderState.questions.splice(dragSrcIdx,1)[0];
        builderState.questions.splice(i,0,moved);
        renderQuestions();
      }
    });
  });
}

function renderQItem(q,i){
  const labels=['A','B','C','D'];
  const opts = q.options.map((opt,oi)=>`
    <div class="opt-row">
      <div class="opt-dot ${labels[oi]}${q.correct===oi?' correct':''}" onclick="setCorrect(${i},${oi})" title="Mark as correct">${labels[oi]}</div>
      <input class="opt-input" type="text" placeholder="Option ${labels[oi]}" value="${esc(opt)}"
        oninput="builderState.questions[${i}].options[${oi}]=this.value"/>
    </div>`).join('');
  const diffBtns = ['easy','medium','hard'].map(d=>
    `<button class="diff-btn ${d} ${q.difficulty===d?'sel-'+d:''}" onclick="setDiff(${i},'${d}')">${d.charAt(0).toUpperCase()+d.slice(1)}</button>`
  ).join('');
  const preview = q.question || `Question ${i+1}`;
  return `<div class="q-item" id="qi-${i}">
    <div class="q-item-header" onclick="toggleQItem(${i})">
      <span class="drag-handle" onclick="event.stopPropagation()" title="Drag to reorder">⠿</span>
      <div class="q-num">${i+1}</div>
      <div class="q-preview ${q.question?'':'empty'}">${esc(preview)}</div>
      <button class="btn btn-icon btn-sm" style="margin-left:auto" onclick="event.stopPropagation();removeQuestion(${i})" title="Delete">✕</button>
      <span class="q-chevron">▼</span>
    </div>
    <div class="q-body">
      <div class="form-group" style="margin-top:10px">
        <label>Question Text</label>
        <textarea rows="2" placeholder="Enter your question here..." oninput="builderState.questions[${i}].question=this.value;updateQPreview(${i},this.value)">${esc(q.question)}</textarea>
      </div>
      <div class="section-label" style="margin-bottom:8px">Answer Options <span style="font-size:10px;color:var(--text3)">(click A/B/C/D to set correct)</span></div>
      <div class="opts-grid">${opts}</div>
      <div class="form-group">
        <label>Explanation (optional)</label>
        <textarea rows="2" placeholder="Explain why the answer is correct..." oninput="builderState.questions[${i}].explanation=this.value">${esc(q.explanation||'')}</textarea>
      </div>
      <div class="section-label">Difficulty</div>
      <div class="diff-select">${diffBtns}</div>
      <div class="form-group">
        <label>Tags (comma-separated, optional)</label>
        <input type="text" placeholder="e.g. physics, motion, newton" value="${(q.tags||[]).join(', ')}"
          oninput="builderState.questions[${i}].tags=this.value.split(',').map(t=>t.trim()).filter(Boolean)"/>
      </div>
    </div>
  </div>`;
}

function toggleQItem(i){
  const el = document.getElementById('qi-'+i);
  if(el) el.classList.toggle('open');
}
function openQItem(el){el&&el.classList.add('open');}

function setCorrect(qi,oi){
  builderState.questions[qi].correct=oi;
  const labels=['A','B','C','D'];
  const item=document.getElementById('qi-'+qi);
  if(item){
    item.querySelectorAll('.opt-dot').forEach((d,idx)=>{
      d.classList.toggle('correct',idx===oi);
    });
  }
}

function setDiff(qi,d){
  builderState.questions[qi].difficulty=d;
  const item=document.getElementById('qi-'+qi);
  if(item){
    item.querySelectorAll('.diff-btn').forEach(b=>{
      b.className=`diff-btn ${b.classList[1]}`;
    });
    const btn=item.querySelector(`.diff-btn.${d}`);
    if(btn) btn.classList.add('sel-'+d);
  }
}

function updateQPreview(qi,val){
  const preview=document.querySelector(`#qi-${qi} .q-preview`);
  if(preview){
    preview.textContent=val||`Question ${qi+1}`;
    preview.classList.toggle('empty',!val);
  }
}

function updateProgress(){
  const q = builderState.questions.length;
  const title = document.getElementById('f-title').value;
  let pct = 10;
  if(title) pct += 30;
  if(q>0) pct += Math.min(q*5,60);
  document.getElementById('buildProgress').style.width = Math.min(pct,100)+'%';
}

// ═══ STYLE TAB ═══
function initStyleGrids(){
  if(styleInited) return;
  styleInited=true;
  const eg = document.getElementById('emojiGrid');
  eg.innerHTML = EMOJIS.map(e=>`<div class="emoji-btn${builderState.icon===e?' selected':''}" onclick="selectEmoji('${e}')">${e}</div>`).join('');
  const sg = document.getElementById('schemeGrid');
  sg.innerHTML = SCHEMES.map(s=>`<div class="scheme-dot${builderState.colorScheme===s.id?' selected':''}"
    style="background:${s.gradient}" title="${s.label}" onclick="selectScheme('${s.id}')"></div>`).join('');
}

function selectEmoji(e){
  builderState.icon=e;
  document.getElementById('f-icon').value=e;
  document.getElementById('iconPreview').textContent=e;
  document.querySelectorAll('.emoji-btn').forEach(b=>b.classList.toggle('selected',b.textContent===e));
}

function updateIconPreview(){
  const v=document.getElementById('f-icon').value;
  builderState.icon=v||'📝';
  document.getElementById('iconPreview').textContent=builderState.icon;
}

function selectScheme(id){
  builderState.colorScheme=id;
  document.querySelectorAll('.scheme-dot').forEach((d,i)=>d.classList.toggle('selected',SCHEMES[i].id===id));
}

function triggerBackdropUpload(){document.getElementById('backdropFile').click();}

function handleBackdropUpload(e){
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    builderState.backdropData=ev.target.result;
    showBackdropPreview(ev.target.result);
  };
  reader.readAsDataURL(file);
}

function showBackdropPreview(data){
  const prev=document.getElementById('backdropPreview');
  const empty=document.getElementById('backdropEmpty');
  prev.src=data;
  prev.classList.add('show');
  empty.style.display='none';
  document.getElementById('clearBackdropBtn').style.display='';
}

function clearBackdrop(){
  builderState.backdropData=null;
  const prev=document.getElementById('backdropPreview');
  const empty=document.getElementById('backdropEmpty');
  if(prev){prev.src='';prev.classList.remove('show');}
  if(empty) empty.style.display='';
  const btn=document.getElementById('clearBackdropBtn');
  if(btn) btn.style.display='none';
  const fi=document.getElementById('backdropFile');
  if(fi) fi.value='';
}

// ═══ IMPORT JSON ═══
function switchImportTab(t){
  document.getElementById('import-paste').classList.toggle('hidden',t!=='paste');
  document.getElementById('import-file').classList.toggle('hidden',t!=='file');
  document.getElementById('itab-paste').classList.toggle('active',t==='paste');
  document.getElementById('itab-file').classList.toggle('active',t==='file');
}

function validateJSON(){
  const val=document.getElementById('jsonInput').value.trim();
  const status=document.getElementById('jsonStatus');
  if(!val){status.style.display='none';return false;}
  try{
    const d=JSON.parse(val);
    if(!d.title||!Array.isArray(d.questions)){
      status.className='json-status json-err';
      status.innerHTML='⚠️ Missing required fields: <code>title</code> and <code>questions[]</code>';
      status.style.display='flex';
      return false;
    }
    status.className='json-status json-ok';
    status.innerHTML='✅ Valid JSON · '+d.questions.length+' question(s) found';
    status.style.display='flex';
    return true;
  }catch(err){
    status.className='json-status json-err';
    status.innerHTML='❌ Invalid JSON: '+err.message;
    status.style.display='flex';
    return false;
  }
}

function importFromJSON(){
  if(!validateJSON()) return;
  try{
    const d=JSON.parse(document.getElementById('jsonInput').value.trim());
    loadQuizDataIntoBuilder(d);
    toast('✅ Quiz imported successfully!','ok');
    switchBTab('questions');
  }catch(e){toast('❌ Failed to import: '+e.message,'err');}
}

function loadQuizDataIntoBuilder(d){
  document.getElementById('f-title').value=d.title||'';
  document.getElementById('f-subject').value=d.subject||'';
  document.getElementById('f-chapter').value=d.chapter||'';
  document.getElementById('f-topic').value=d.topic||'';
  document.getElementById('f-desc').value=d.description||'';
  document.getElementById('f-timer').value=d.timerSeconds||30;
  document.getElementById('f-author').value=d.author||'';
  document.getElementById('f-icon').value=d.icon||'📝';
  builderState.icon=d.icon||'📝';
  builderState.colorScheme=d.colorScheme||'purple';
  builderState.questions=(d.questions||[]).map(q=>({
    question:q.question||'',
    options:Array.isArray(q.options)&&q.options.length===4?q.options:['','','',''],
    correct:typeof q.correct==='number'?q.correct:0,
    explanation:q.explanation||'',
    difficulty:q.difficulty||'easy',
    tags:q.tags||[]
  }));
  styleInited=false;
  initStyleGrids();
  renderQuestions();
  updateIconPreview();
  updateProgress();
}

function loadExampleJSON(){
  const ex={
    title:"Physics: Laws of Motion",
    subject:"Physics",chapter:"Chapter 3",topic:"Newton's Laws",
    description:"Test your knowledge of classical mechanics",
    author:"Self Study",timerSeconds:25,icon:"⚡",colorScheme:"ocean",
    questions:[
      {question:"Newton's First Law is also known as the Law of?",options:["Acceleration","Inertia","Gravitation","Motion"],correct:1,explanation:"Newton's First Law states that an object stays at rest or in motion unless acted upon by a force — this property is called Inertia.",difficulty:"easy",tags:["newton","inertia"]},
      {question:"If F = 10N and m = 2kg, what is the acceleration?",options:["2 m/s²","5 m/s²","8 m/s²","20 m/s²"],correct:1,explanation:"Using F = ma, a = F/m = 10/2 = 5 m/s²",difficulty:"medium",tags:["formula","acceleration"]},
      {question:"Action and reaction forces act on?",options:["Same object","Different objects","Both same and different","Neither"],correct:1,explanation:"Newton's Third Law: action and reaction are equal and opposite, acting on different objects.",difficulty:"easy",tags:["newton","third law"]}
    ]
  };
  document.getElementById('jsonInput').value=JSON.stringify(ex,null,2);
  validateJSON();
}

function clearJSONInput(){
  document.getElementById('jsonInput').value='';
  document.getElementById('jsonStatus').style.display='none';
}

function handleJSONFileUpload(e){
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      loadQuizDataIntoBuilder(d);
      toast('✅ JSON file loaded!','ok');
      switchBTab('questions');
    }catch(err){toast('❌ Invalid JSON file','err');}
  };
  reader.readAsText(file);
}

// ═══ SAVE ═══
async function saveQuiz(){
  const title=document.getElementById('f-title').value.trim();
  if(!title){toast('⚠️ Please enter a quiz title','err');switchBTab('info');return;}
  if(builderState.questions.length===0){toast('⚠️ Add at least one question','err');switchBTab('questions');return;}
  const quiz={
    id: currentEditId||('q_'+Date.now()),
    title,
    subject:document.getElementById('f-subject').value.trim(),
    chapter:document.getElementById('f-chapter').value.trim(),
    topic:document.getElementById('f-topic').value.trim(),
    description:document.getElementById('f-desc').value.trim(),
    timerSeconds:parseInt(document.getElementById('f-timer').value)||30,
    author:document.getElementById('f-author').value.trim(),
    icon:builderState.icon,
    colorScheme:builderState.colorScheme,
    backdropData:builderState.backdropData,
    questions:builderState.questions,
    updatedAt:Date.now()
  };
  await putQuiz(quiz);
  currentEditId=quiz.id;
  toast('💾 Quiz saved!','ok');
}

// ═══ PREVIEW ═══
function buildPreview(){
  const title=document.getElementById('f-title').value||'My Quiz';
  const scheme=SCHEMES.find(s=>s.id===builderState.colorScheme)||SCHEMES[0];
  const header=SCHEME_HEADERS[builderState.colorScheme]||SCHEME_HEADERS.purple;
  const q=builderState.questions[0];
  const qText=q?q.question:'Sample question text?';
  const opts=q?q.options:['Option A','Option B','Option C','Option D'];
  const bannerStyle = builderState.backdropData
    ? `background-image:url('${builderState.backdropData}');background-size:cover;background-position:center;`
    : `background:${header};`;
  document.getElementById('previewContainer').innerHTML=`
    <div class="preview-card">
      <div class="prev-header" style="${bannerStyle}padding:14px 16px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:10px;font-weight:700;color:rgba(255,255,255,.8);background:rgba(0,0,0,.2);padding:3px 9px;border-radius:99px">OpenQuiz</span>
          <span style="font-size:10px;color:rgba(255,255,255,.6)">✕ Quit</span>
        </div>
        <div class="prev-title" style="margin-top:6px">${esc(title)}</div>
        <div class="prev-sub">${esc(document.getElementById('f-subject').value||'')}</div>
        <div class="prev-prog"><div class="prev-prog-fill"></div></div>
      </div>
      <div class="prev-body">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="background:var(--c1l);color:var(--c1);font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">Q 1 / ${builderState.questions.length||'?'}</span>
          <span style="background:var(--correct-bg);color:var(--correct);font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">✅ 0</span>
        </div>
        <div class="prev-q">${esc(qText)}</div>
        <div class="prev-opts">
          ${opts.map((o,i)=>`<div class="prev-opt"><span class="prev-opt-lbl">${['A','B','C','D'][i]}</span>${esc(o||'Option '+['A','B','C','D'][i])}</div>`).join('')}
        </div>
      </div>
    </div>`;
}
