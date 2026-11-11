const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createServer,hasScheduleConflict,courses}=require('../src/server');
test('jadwal pada hari dan jam bertumpang tindih terdeteksi',()=>assert.equal(hasScheduleConflict([courses[0],courses[1]]),true));
test('jadwal pada hari berbeda tidak bentrok',()=>assert.equal(hasScheduleConflict([courses[0],courses[2]]),false));
test('health endpoint mengembalikan status ok',async t=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>s.close());const r=await fetch(`http://127.0.0.1:${s.address().port}/health`);assert.equal(r.status,200);assert.equal((await r.json()).status,'ok')});
test('KRS bentrok ditolak dengan HTTP 409',async t=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>s.close());const r=await fetch(`http://127.0.0.1:${s.address().port}/api/krs`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({courseIds:['IF101','IF202']})});assert.equal(r.status,409)});
test('KRS tanpa bentrok diterima dengan HTTP 201',async t=>{const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>s.close());const r=await fetch(`http://127.0.0.1:${s.address().port}/api/krs`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({courseIds:['IF101','IF303']})});assert.equal(r.status,201);assert.equal((await r.json()).totalCredits,6)});
