/* ════════════════════════════════════════
   OpenQuiz — Utilities & Constants
   ════════════════════════════════════════ */

const DB_NAME = 'OpenQuizDB';
const DB_VERSION = 2;
const STORE = 'quizzes';
let db = null;
let currentEditId = null;
let isDark = true;

const EMOJIS = [
  '📝','📚','🔬','⚡','🧪','🌍','🔭','🧬','🎓','💡',
  '🧮','📐','🔢','🌊','🔥','❄️','🌱','🏆','🎯','🚀',
  '💻','🖥️','🌐','🛠️','⚙️','📊','📈','🧩','🎲','🎮',
  '🏛️','🗺️','🌸','🦁','🐬','🦋','🍎','🔴','🟦','⭐',
  '🏅','🥇','🎵','📜','🔑','💎','🌙','☀️','🌈','🧠'
];

const SCHEMES = [
  {id:'purple', label:'Violet', gradient:'linear-gradient(135deg,#6c3bff,#ff5f7a)', header:'linear-gradient(90deg,#6c3bff,#a78bfa)'},
  {id:'ocean',  label:'Ocean',  gradient:'linear-gradient(135deg,#0099ff,#00e5d0)', header:'linear-gradient(90deg,#0077cc,#00b8d4)'},
  {id:'sunset', label:'Sunset', gradient:'linear-gradient(135deg,#ff6b35,#ff3d7f)', header:'linear-gradient(90deg,#ff6b35,#ff8f00)'},
  {id:'forest', label:'Forest', gradient:'linear-gradient(135deg,#1db954,#8bc34a)', header:'linear-gradient(90deg,#15803d,#4ade80)'},
  {id:'rose',   label:'Rose',   gradient:'linear-gradient(135deg,#e91e8c,#ff6584)', header:'linear-gradient(90deg,#be185d,#f472b6)'},
  {id:'gold',   label:'Gold',   gradient:'linear-gradient(135deg,#f5a623,#ff9800)', header:'linear-gradient(90deg,#b45309,#fbbf24)'},
  {id:'arctic', label:'Arctic', gradient:'linear-gradient(135deg,#5cc8ff,#a78bfa)', header:'linear-gradient(90deg,#0284c7,#818cf8)'},
];

const SCHEME_HEADERS = {
  purple:'linear-gradient(90deg,#6c3bff,#a78bfa)',
  ocean:'linear-gradient(90deg,#0077cc,#00b8d4)',
  sunset:'linear-gradient(90deg,#ff6b35,#ff8f00)',
  forest:'linear-gradient(90deg,#15803d,#4ade80)',
  rose:'linear-gradient(90deg,#be185d,#f472b6)',
  gold:'linear-gradient(90deg,#b45309,#fbbf24)',
  arctic:'linear-gradient(90deg,#0284c7,#818cf8)',
};

function esc(s){if(!s) return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function toast(msg,type='info'){
  const wrap=document.getElementById('toastWrap');
  const el=document.createElement('div');
  el.className='toast '+type;el.textContent=msg;
  wrap.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),350);},2600);
}

function copyCode(id){
  const el=document.getElementById(id);
  let text=el.textContent.replace(/^Copy\n/,'').trim();
  navigator.clipboard.writeText(text).then(()=>toast('📋 Copied to clipboard!','ok')).catch(()=>toast('❌ Copy failed','err'));
}

function copyText(text){
  navigator.clipboard.writeText(text).then(()=>toast('📋 Copied to clipboard!','ok')).catch(()=>toast('❌ Copy failed','err'));
}

function closeModal(id){document.getElementById(id).classList.add('hidden');}

function copyFullAIPrompt(){
  const prompt = document.getElementById('aiPrompt');
  let text = prompt.textContent.replace(/^Copy\n/,'').trim();
  copyText(text);
}
