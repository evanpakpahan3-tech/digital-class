const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const PORT = Number(process.env.PORT || 3000);

const courses = [
  {id:'IF101',name:'Algoritma dan Pemrograman',day:'Senin',start:'08:00',end:'10:00',credits:3},
  {id:'IF202',name:'Basis Data',day:'Senin',start:'09:00',end:'11:00',credits:3},
  {id:'IF303',name:'Jaringan Komputer',day:'Selasa',start:'10:00',end:'12:00',credits:3},
  {id:'IF404',name:'Rekayasa Perangkat Lunak',day:'Rabu',start:'13:00',end:'15:00',credits:3}
];

function hasScheduleConflict(items) {
  for (let i=0;i<items.length;i++) for (let j=i+1;j<items.length;j++) {
    const a=items[i], b=items[j];
    if (a.day===b.day && a.start<b.end && b.start<a.end) return true;
  }
  return false;
}
function send(res,status,data) {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data',chunk=>{body+=chunk;if(body.length>1000000) reject(new Error('Request terlalu besar'));});
    req.on('end',()=>{try{resolve(body?JSON.parse(body):{});}catch{reject(new Error('JSON tidak valid'));}});
    req.on('error',reject);
  });
}
function createServer() {
  return http.createServer(async (req,res)=>{
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(req.method==='GET'&&url.pathname==='/health') return send(res,200,{status:'ok',service:'digital-kampus-demo'});
    if(req.method==='GET'&&url.pathname==='/api/courses') return send(res,200,{data:courses});
    if(req.method==='POST'&&url.pathname==='/api/krs') {
      try {
        const body=await readBody(req);
        if(!Array.isArray(body.courseIds)||!body.courseIds.length) return send(res,400,{error:'Pilih minimal satu mata kuliah.'});
        const ids=[...new Set(body.courseIds)];
        const selected=ids.map(id=>courses.find(c=>c.id===id));
        if(selected.some(c=>!c)) return send(res,400,{error:'Kode mata kuliah tidak dikenal.'});
        if(hasScheduleConflict(selected)) return send(res,409,{error:'Jadwal mata kuliah bentrok.'});
        return send(res,201,{message:'Simulasi KRS berhasil divalidasi.',studentId:String(body.studentId||'DEMO-001'),courseIds:ids,totalCredits:selected.reduce((s,c)=>s+c.credits,0)});
      } catch(e) { return send(res,400,{error:e.message}); }
    }
    if(req.method==='GET'&&url.pathname==='/') {
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      return res.end(fs.readFileSync(path.join(__dirname,'..','public','index.html')));
    }
    return send(res,404,{error:'Endpoint tidak ditemukan.'});
  });
}
if(require.main===module) createServer().listen(PORT,'0.0.0.0',()=>console.log(`Demo berjalan pada port ${PORT}`));
module.exports={createServer,hasScheduleConflict,courses};
