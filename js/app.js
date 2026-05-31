/* ════════════════════════════════════════
   OpenQuiz — App Init, Routing, Theme, Sidebar
   ════════════════════════════════════════ */

function showPage(name){
  ['library','builder','help','settings'].forEach(p=>{
    document.getElementById('page-'+p).classList.toggle('hidden',p!==name);
    const nb=document.getElementById('nav-'+p);
    if(nb) nb.classList.toggle('active',p===name);
    const snb=document.getElementById('snav-'+p);
    if(snb) snb.classList.toggle('active',p===name);
  });
  if(name==='library') loadLibrary();
  if(name==='builder'){
    initStyleGrids();
    updateDownloadBtnVis();
  }
  if(name==='preview') buildPreview();
  closeSidebar();
  window.scrollTo(0,0);
}

function getSetting(key, def){
  try{const v=localStorage.getItem('oq-'+key);return v!==null?v:def;}catch(e){return def;}
}
function setSetting(key, val){
  try{localStorage.setItem('oq-'+key,val);}catch(e){}
}
function toggleTheme(){
  isDark=!isDark;
  document.body.classList.toggle('theme-light',!isDark);
  document.getElementById('themeToggle').textContent=isDark?'🌙':'☀️';
  document.getElementById('lightToggle').classList.toggle('on',!isDark);
  localStorage.setItem('oq-theme',isDark?'dark':'light');
}
function toggleDownloadBtn(){
  const t=document.getElementById('downloadToggle');
  const on=t.classList.toggle('on');
  setSetting('downloadBtn',on?'1':'0');
  updateDownloadBtnVis();
}
function updateDownloadBtnVis(){
  const show=getSetting('downloadBtn','1')==='1';
  const btn=document.getElementById('headerDownloadBtn');
  if(btn) btn.style.display=show?'':'none';
}

// ═══ Sidebar ═══
function toggleSidebar(){
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  const isOpen=sidebar.classList.contains('open');
  sidebar.classList.toggle('open',!isOpen);
  overlay.classList.toggle('open',!isOpen);
  document.body.classList.toggle('sidebar-open',!isOpen);
}

function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.body.classList.remove('sidebar-open');
}

// ═══ Init ═══
async function init(){
  await initDB();
  const saved=localStorage.getItem('oq-theme');
  if(saved==='light'){isDark=false;document.body.classList.add('theme-light');document.getElementById('themeToggle').textContent='☀️';document.getElementById('lightToggle').classList.add('on');}
  // Load settings
  const downloadOn=getSetting('downloadBtn','1')==='1';
  document.getElementById('downloadToggle').classList.toggle('on',downloadOn);
  const footer=getSetting('footer','Made with OpenQuiz · Self Study');
  document.getElementById('footerTextInput').value=footer;
  const geminiKey=getSetting('geminiKey','');
  document.getElementById('geminiKeyInput').value=geminiKey;
  updateDownloadBtnVis();
  loadLibrary();
}

document.addEventListener('DOMContentLoaded',init);
