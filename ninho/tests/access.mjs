import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {readFileSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import worker from '../backend/worker.mjs';
const here=dirname(fileURLToPath(import.meta.url)),dir=mkdtempSync(join(tmpdir(),'ninho-')),database=join(dir,'db.sqlite');
const sql=statements=>JSON.parse(execFileSync('python3',[join(here,'sqlite-d1.py'),database],{input:JSON.stringify({statements}),encoding:'utf8'}));
execFileSync('python3',[join(here,'sqlite-d1.py'),database],{input:JSON.stringify({schema:readFileSync(join(here,'../backend/schema.sql'),'utf8')})});
class Stmt{constructor(sql){this.sql=sql;this.args=[]}bind(...args){this.args=args;return this}async first(){return sql([this])[0][0]||null}async run(){sql([this]);return {success:true}}}
const env={DB:{prepare:s=>new Stmt(s),batch:async statements=>sql(statements)},PUBLIC_ORIGIN:'https://newstodayhealth.online',PRODUCT_ID:'ninho',WEBHOOK_SECRET:'w'.repeat(48),ACCESS_CODE_SECRET:'a'.repeat(48),RESEND_API_KEY:'test-only',MAIL_FROM:'Ninho <test@example.test>'};
let emails=[];const originalFetch=globalThis.fetch;globalThis.fetch=async(url,opts)=>{assert.equal(url,'https://api.resend.com/emails');emails.push(JSON.parse(opts.body));return new Response('{"id":"mock"}',{status:200})};
const request=(path,method='GET',data,headers={})=>new Request(env.PUBLIC_ORIGIN+'/ninho/api'+path,{method,headers:{...(method==='GET'?{}:{Origin:env.PUBLIC_ORIGIN,'Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
const call=async(...args)=>worker.fetch(request(...args),env);
async function event(data,secret=env.WEBHOOK_SECRET,timestamp=Math.floor(Date.now()/1000)){const raw=JSON.stringify(data),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw))).toString('hex');return worker.fetch(new Request(env.PUBLIC_ORIGIN+'/ninho/api/webhook',{method:'POST',headers:{'x-ninho-timestamp':String(timestamp),'x-ninho-signature':'sha256='+sig},body:raw}),env)}
try{
 assert.equal((await call('/session')).status,401);assert.equal((await call('/plan')).status,401);assert.equal((await call('/plan','PUT',{})).status,401);assert.equal((await worker.fetch(request('/session'),{})).status,503);
 const approved={event_id:'evt-1',order_id:'order-1',email:'buyer@example.test',product_id:'ninho',status:'approved',amount:999,currency:'USD'};
 assert.equal((await event(approved,'wrong')).status,401);assert.equal((await event(approved,env.WEBHOOK_SECRET,Math.floor(Date.now()/1000)-1000)).status,401);assert.equal((await event({...approved,amount:998})).status,400);
 assert.equal((await event(approved)).status,200);assert.equal(emails.length,1);assert.equal((await event(approved)).status,200);assert.equal(emails.length,1);
 const code=emails[0].text.match(/Código de acceso: (.+)/)[1];assert.equal((await call('/login','POST',{email:approved.email,code:'0'.repeat(32)})).status,401);
 const login=await call('/login','POST',{email:approved.email,code});assert.equal(login.status,200);const cookie=login.headers.get('Set-Cookie');assert(cookie.includes('HttpOnly; Secure; SameSite=Lax'));const h={Cookie:cookie.split(';')[0]};
 const session=await call('/session','GET',undefined,h);assert.equal((await session.json()).email,approved.email);
 const plan={version:1,profile:{name:'Test'},items:[],links:[],wardrobe:[],guests:[],chat:[],email:'attacker@example.test'};
 assert.equal((await call('/plan','PUT',plan,{...h,Origin:'https://evil.test'})).status,403);assert.equal((await call('/plan','PUT',plan,h)).status,200);assert.equal((await (await call('/plan','GET',undefined,h)).json()).plan.profile.name,'Test');
 assert.equal(sql([{sql:'SELECT email FROM plans',args:[]}])[0][0].email,approved.email);
 assert.equal((await event({...approved,event_id:'evt-2',status:'refunded'})).status,200);assert.equal((await call('/session','GET',undefined,h)).status,401);assert.equal((await call('/login','POST',{email:approved.email,code})).status,401);
 assert.equal((await event({...approved,event_id:'evt-3'})).status,200);assert.equal(emails.length,1);assert.equal((await call('/session','GET',undefined,h)).status,401);
 assert.equal((await event({...approved,event_id:'evt-4',order_id:'order-2'})).status,200);assert.equal(emails.length,2);
 const code2=emails[1].text.match(/Código de acceso: (.+)/)[1];const login2=await call('/login','POST',{email:approved.email,code:code2});assert.equal(login2.status,200);const h2={Cookie:login2.headers.get('Set-Cookie').split(';')[0]};assert.equal((await call('/logout','POST',{},h2)).status,200);assert.equal((await call('/session','GET',undefined,h2)).status,401);
 for(let i=0;i<16;i++)await call('/login','POST',{email:'rate@example.test',code:'0'.repeat(32)});assert.equal((await call('/login','POST',{email:'rate@example.test',code:'0'.repeat(32)})).status,429);
 console.log('PASS: signed purchase, amount/product guards, idempotency, emailed code (mock), session, CSRF, account ownership, refunds, out-of-order events, logout and rate limits.');
}finally{globalThis.fetch=originalFetch;rmSync(dir,{recursive:true,force:true})}
