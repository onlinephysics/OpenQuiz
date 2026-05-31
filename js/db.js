/* ════════════════════════════════════════
   OpenQuiz — IndexedDB Operations
   ════════════════════════════════════════ */

function initDB(){
  return new Promise((res,rej)=>{
    const req = indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded = e=>{
      const d = e.target.result;
      if(!d.objectStoreNames.contains(STORE)){
        d.createObjectStore(STORE,{keyPath:'id'});
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
