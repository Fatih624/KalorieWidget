import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';

const COOKIE='__Host-kalorie-session', lifetime=30*86400;
const hex=(bytes:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');
const bytes=(value:string)=>new Uint8Array(value.match(/.{2}/g)!.map(v=>parseInt(v,16)));
export const passwordEnabled=()=>!!(env.APP_PASSWORD_HASH&&env.APP_PASSWORD_SALT&&env.APP_OWNER_ID&&env.APP_SECRET);
let tables:Promise<unknown>|undefined;
export async function authTables(){if(!env.DB)throw new Error('Datenspeicher fehlt.');return tables??=env.DB.batch([
 env.DB.prepare('CREATE TABLE IF NOT EXISTS app_sessions (hash TEXT PRIMARY KEY, owner TEXT NOT NULL, expires_at INTEGER NOT NULL)'),
 env.DB.prepare('CREATE TABLE IF NOT EXISTS auth_attempts (id TEXT PRIMARY KEY, calls INTEGER NOT NULL, expires_at INTEGER NOT NULL)'),
 env.DB.prepare('CREATE TABLE IF NOT EXISTS owner_secrets (owner TEXT PRIMARY KEY, encrypted TEXT NOT NULL, updated_at INTEGER NOT NULL)')
]).catch(e=>{tables=undefined;throw e;});}
async function digest(value:string){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
function tokenFrom(cookie:string){return cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export async function sessionOwner(cookie:string){if(!passwordEnabled())return null;const token=tokenFrom(cookie);if(!/^[a-f0-9]{64}$/.test(token))return null;await authTables();const row=await env.DB!.prepare('SELECT owner FROM app_sessions WHERE hash=? AND expires_at>?').bind(await digest(token),Date.now()).first<{owner:string}>();return row && row.owner===env.APP_OWNER_ID?row.owner:null;}
export async function browserOwner(){return sessionOwner((await headers()).get('cookie')||'');}
export async function login(req:Request){
 if(!passwordEnabled())return Response.json({error:'Der Passwortzugang wird eingerichtet.'},{status:503});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Bitte die App direkt öffnen.'},{status:403});
 const text=await req.text();if(text.length>1024)return Response.json({error:'Ungültige Eingabe.'},{status:400});
 let password:unknown,embedded=false;try{const input=JSON.parse(text);password=input.password;embedded=input.embedded===true;}catch{return Response.json({error:'Ungültige Eingabe.'},{status:400});}
 if(typeof password!=='string'||password.length>256)return Response.json({error:'Bitte Passwort eingeben.'},{status:400});
 await authTables();const now=Date.now(),window=Math.floor(now/900000),ip=await digest((req.headers.get('cf-connecting-ip')||'unknown')+env.APP_PASSWORD_SALT);
 const counters=await env.DB!.batch(['global',ip].map(id=>env.DB!.prepare('INSERT INTO auth_attempts(id,calls,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET calls=calls+1 RETURNING calls').bind(`${window}:${id}`,now+900000)));
 if(Number((counters[0].results[0] as {calls?:number})?.calls)>60||Number((counters[1].results[0] as {calls?:number})?.calls)>5)return Response.json({error:'Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.'},{status:429,headers:{'retry-after':'900','cache-control':'no-store'}});
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const actual=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(env.APP_PASSWORD_SALT!),iterations:100000,hash:'SHA-256'},key,256));
 let mismatch=actual.length^env.APP_PASSWORD_HASH!.length;for(let i=0;i<actual.length;i++)mismatch|=actual.charCodeAt(i)^(env.APP_PASSWORD_HASH!.charCodeAt(i)||0);
 if(mismatch)return Response.json({error:'Das Passwort stimmt nicht.'},{status:401,headers:{'cache-control':'no-store'}});
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 await env.DB!.batch([env.DB!.prepare('INSERT INTO app_sessions(hash,owner,expires_at) VALUES(?,?,?)').bind(await digest(token),env.APP_OWNER_ID,now+lifetime*1000),env.DB!.prepare('DELETE FROM app_sessions WHERE expires_at<?').bind(now),env.DB!.prepare('DELETE FROM auth_attempts WHERE expires_at<? OR id=?').bind(now,`${window}:${ip}`)]);
 return Response.json({ok:true},{headers:{'cache-control':'no-store','set-cookie':`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=${embedded?'None; Partitioned':'Strict'}; Max-Age=${lifetime}`}});
}
export async function logout(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)return new Response(null,{status:403});await authTables();await env.DB!.prepare('DELETE FROM app_sessions WHERE hash=?').bind(await digest(tokenFrom(req.headers.get('cookie')||''))).run();return Response.json({ok:true},{headers:{'cache-control':'no-store','set-cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`}});}
async function encryptionKey(){if(!env.APP_SECRET)throw new Error('Schlüsselspeicher noch nicht eingerichtet.');return crypto.subtle.importKey('raw',bytes(env.APP_SECRET),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function storedOpenAIKey(owner:string){if(env.OPENAI_API_KEY)return env.OPENAI_API_KEY;await authTables();const row=await env.DB!.prepare('SELECT encrypted FROM owner_secrets WHERE owner=?').bind(owner).first<{encrypted:string}>();if(!row)return '';const [iv,cipher]=row.encrypted.split('.');return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:new TextEncoder().encode(owner)},await encryptionKey(),bytes(cipher)));}
export async function saveOpenAIKey(owner:string,value:unknown){if(typeof value!=='string'||!/^sk-[A-Za-z0-9_-]{20,300}$/.test(value.trim()))throw new Error('Bitte einen gültigen OpenAI-Schlüssel eingeben.');await authTables();const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(owner)},await encryptionKey(),new TextEncoder().encode(value.trim()));await env.DB!.prepare('INSERT INTO owner_secrets(owner,encrypted,updated_at) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET encrypted=excluded.encrypted,updated_at=excluded.updated_at').bind(owner,hex(iv)+'.'+hex(cipher),Date.now()).run();}
