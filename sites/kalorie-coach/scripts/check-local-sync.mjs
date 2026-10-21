// Exercises the local preview only. Never runs against a published journal.
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
const origin = 'http://127.0.0.1:5173';
const browser = { cookie: '__sites_local_auth=1', origin };
async function call(path, method='GET', input, headers=browser) {
  const r = await fetch(`${origin}/api/coach/${path}`, { method, headers: { ...headers, ...(input ? { 'content-type': 'application/json' } : {}) }, body: input ? JSON.stringify(input) : undefined, redirect: 'manual' });
  const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return { status:r.status, data };
}
assert.equal((await call('state','GET',undefined,{})).status,401);
assert.equal((await call('state','GET',undefined,{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'forged@example.test'})).status,401);
const original=await call('state'); assert.equal(original.status,200);
let device;
try {
  assert.equal((await call('state','PUT',{expectedRevision:original.data.revision,snapshot:original.data.snapshot},{...browser,origin:'https://example.test'})).status,403);
  const a=structuredClone(original.data.snapshot),b=structuredClone(a); a.goals.kcal=2101;b.goals.kcal=2102;
  const writes=await Promise.all([a,b].map(snapshot=>call('state','PUT',{expectedRevision:original.data.revision,snapshot})));
  assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);
  const fresh=await call('state');
  assert.equal((await call('state','PUT',{expectedRevision:fresh.data.revision,snapshot:{...a,goals:{...a.goals,kcal:-10}}})).status,400);
  const pair=await call('pair','POST',{}); assert.equal(pair.status,200);
  const token=randomBytes(24).toString('hex');
  const claim={code:pair.data.code,token};
  assert.equal((await call('claim','POST',claim,{})).status,200);
  device=(await call('devices')).data.devices.find(x=>x.hash===createHash('sha256').update(token).digest('hex'));
  assert.equal((await call('claim','POST',claim,{})).status,401);
  const native={'x-device-token':token};
  const pulled=await call('state','GET',undefined,native); assert.equal(pulled.status,200);assert.deepEqual(pulled.data,fresh.data);
  assert.equal((await call('devices','GET',undefined,native)).status,404);
  assert.equal((await call('state','GET',undefined,{'x-device-token':randomBytes(24).toString('hex')})).status,401);
  assert.equal((await call('devices','DELETE',{hash:device.hash})).status,200);
  assert.equal((await call('state','GET',undefined,native)).status,401);
  device=null;
  console.log('PASS: anonymous/forged identity rejected; browser origin checked; concurrent writes protected; invalid data rejected; pairing single-use; device access scoped and revocable.');
} finally {
  if(device) await call('devices','DELETE',{hash:device.hash});
  const latest=await call('state');
  assert.equal((await call('state','PUT',{expectedRevision:latest.data.revision,snapshot:original.data.snapshot})).status,200);
}
