/* ════════════════════════════════════════
   OpenQuiz — IndexedDB Operations
   ════════════════════════════════════════ */

const VERSION_STORE = 'versions';

function initDB(){
  return new Promise((res,rej)=>{
    const req = indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded = e=>{
      const d = e.target.result;
      if(!d.objectStoreNames.contains(STORE)){
        d.createObjectStore(STORE,{keyPath:'id'});
      }
      if(!d.objectStoreNames.contains(VERSION_STORE)){
        const vs = d.createObjectStore(VERSION_STORE,{keyPath:'id'});
        vs.createIndex('quizId','quizId',{unique:false});
      }
    };
    req.onsuccess = e=>{ db=e.target.result; res(db); };
    req.onerror = e=>rej(e.target.error);
  });
}

function getAllQuizzes(){
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).getAll();
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e.target.error);
  });
}

function getQuiz(id){
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).get(id);
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e.target.error);
  });
}

function putQuiz(quiz){
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readwrite');
    const req=tx.objectStore(STORE).put(quiz);
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e.target.error);
  });
}

function deleteQuizDB(id){
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readwrite');
    const req=tx.objectStore(STORE).delete(id);
    req.onsuccess=e=>res();
    req.onerror=e=>rej(e.target.error);
  });
}

function clearAllDB(){
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE,'readwrite');
    const req=tx.objectStore(STORE).clear();
    req.onsuccess=e=>res();
    req.onerror=e=>rej(e.target.error);
  });
}

// ═══ Versions ═══

function getVersions(quizId){
  return new Promise((res,rej)=>{
    const tx=db.transaction(VERSION_STORE,'readonly');
    const idx=tx.objectStore(VERSION_STORE).index('quizId');
    const req=idx.getAll(quizId);
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e.target.error);
  });
}

function putVersion(v){
  return new Promise((res,rej)=>{
    const tx=db.transaction(VERSION_STORE,'readwrite');
    const req=tx.objectStore(VERSION_STORE).put(v);
    req.onsuccess=e=>res(e.target.result);
    req.onerror=e=>rej(e.target.error);
  });
}

function deleteVersionsForQuiz(quizId){
  return new Promise(async (res,rej)=>{
    try{
      const versions=await getVersions(quizId);
      const tx=db.transaction(VERSION_STORE,'readwrite');
      const store=tx.objectStore(VERSION_STORE);
      versions.forEach(v=>store.delete(v.id));
      tx.oncomplete=()=>res();
      tx.onerror=e=>rej(e.target.error);
    }catch(e){rej(e);}
  });
}
