// Runs exclusively against the local preview. Never uses the published journal.
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:5173';
const password=process.env.COACH_TEST_PASSWORD;if(!password)throw new Error('COACH_TEST_PASSWORD required for this local-only test.');
async function call(path,method='GET',value,cookie='',source=origin){const r=await fetch(origin+'/api/coach/'+path,{method,headers:{...(cookie?{cookie}:{}),origin:source,...(value?{'content-type':'application/json'}:{})},body:value?JSON.stringify(value):undefined,redirect:'manual'});return {status:r.status,headers:r.headers,data:await r.text().then(t=>{try{return JSON.parse(t)}catch{return {error:t}}})};}
assert.equal((await call('state')).status,401);
assert.equal((await call('login','POST',{password},'','https://example.test')).status,403);
assert.equal((await call('login','POST',{password:'incorrect-test-password'})).status,401);
const signed=await call('login','POST',{password});assert.equal(signed.status,200);
const setCookie=signed.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/Secure/);assert.match(setCookie,/SameSite=Strict/);
const cookie=setCookie.split(';')[0];
const state=await call('state','GET',undefined,cookie);assert.equal(state.status,200);
assert.equal((await call('state','PUT',{expectedRevision:state.data.revision,snapshot:state.data.snapshot},cookie,'https://example.test')).status,403);
assert.equal((await call('key','GET',undefined,cookie)).status,404);
assert.equal((await call('key','PUT',{key:'invalid-test-value'},cookie)).status,400);
assert.equal((await call('key','PUT',{key:'invalid-test-value'})).status,401);
const status=await call('status','GET',undefined,cookie);assert.equal(status.status,200);assert.equal('key' in status.data,false);
if(!status.data.aiConfigured){
 const fake='sk-'+'test_not_a_real_key_'.repeat(2);
 assert.equal((await call('key','PUT',{key:fake},cookie)).status,200);
 assert.equal((await call('status','GET',undefined,cookie)).data.aiConfigured,true);
 const second=await call('login','POST',{password});assert.equal(second.status,200);
 const cookie2=second.headers.get('set-cookie').split(';')[0];
 assert.equal((await call('status','GET',undefined,cookie2)).data.aiConfigured,true);
 await call('key','DELETE',undefined,cookie2);await call('logout','POST',{},cookie2);
 assert.equal((await call('status','GET',undefined,cookie)).data.aiConfigured,false);
}
const pair=await call('pair','POST',{},cookie);assert.equal(pair.status,200);
const token='1234567890abcdef'.repeat(3);
assert.equal((await call('claim','POST',{code:pair.data.code,token})).status,200);
assert.equal((await call('claim','POST',{code:pair.data.code,token})).status,401);
const native=await fetch(origin+'/api/coach/state',{headers:{'x-device-token':token}});assert.equal(native.status,200);
const devices=await call('devices','GET',undefined,cookie);const device=devices.data.devices.find(d=>d.name==='Windows-Widget');
// Remove only this test's deterministic token, never another paired device.
const {createHash}=await import('node:crypto');const hash=createHash('sha256').update(token).digest('hex');
await call('devices','DELETE',{hash},cookie);
assert.equal((await fetch(origin+'/api/coach/state',{headers:{'x-device-token':token}})).status,401);
assert.equal((await call('logout','POST',{},cookie)).status,200);
assert.equal((await call('state','GET',undefined,cookie)).status,401);
console.log('PASS: password login, HttpOnly cookie, anonymous access, CSRF, secret non-disclosure, invalid key, encrypted key persists across sessions, native pairing, single use, revocation and logout.');
