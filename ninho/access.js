'use strict';
(async()=>{const root=document.querySelector('#app');try{
 const api=window.NINHO_CONFIG.apiBase;const session=await fetch(api+'/session',{credentials:'same-origin',cache:'no-store'});if(session.status===401){localStorage.removeItem('ninho-v1');location.replace('./login.html');return}if(!session.ok||!session.headers.get('content-type')?.includes('application/json'))throw Error('El acceso está pendiente de activación.');const user=await session.json();if(user.authorized!==true)throw Error('No se pudo verificar tu compra.');
 const response=await fetch(api+'/plan',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('No pudimos recuperar tu plan. Intenta de nuevo.');const {plan}=await response.json();
 // Only the authenticated account's plan is loaded; never reuse another account's local cache.
 localStorage.removeItem('ninho-v1');if(plan)localStorage.setItem('ninho-v1',JSON.stringify(plan));window.NINHO_AUTH={authorized:true,email:user.email};
 for(const src of ['market.js','app.js','funnel.js','account.js'])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s)});
}catch(error){root.innerHTML='<main class="onboard"><div class="f-mascot">♡</div><h1>No pudimos abrir tu plan.</h1><p id="access-error" class="muted"></p><a class="btn" href="./login.html">Volver al acceso</a></main>';document.querySelector('#access-error').textContent=error.message||'Comprueba tu conexión e intenta de nuevo.'}})();
