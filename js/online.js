/* وضع أونلاين: مطابقة عشوائية أو غرفة بكود، عبر WebSocket مع خادم البوت */
(function(BL){
const $=id=>document.getElementById(id);let ws=null;
const send=o=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(o));};
function connect(cb){
  const T=window.Telegram&&Telegram.WebApp;
  if(!T||!T.initData){BL.toast&&BL.toast('🌐 الأونلاين يعمل داخل تيليجرام فقط');return cb(false);}
  if(ws&&ws.readyState===1)return cb(true);
  ws=new WebSocket((BL.SERVER||location.origin).replace(/^http/,'ws')+'/ws');
  ws.onopen=()=>{send({t:'auth',initData:T.initData});cb(true);};
  ws.onmessage=e=>on(JSON.parse(e.data));ws.onclose=()=>{ws=null;};ws.onerror=()=>{BL.toast&&BL.toast('تعذّر الاتصال بالخادم');cb(false);};
}
function on(m){
  const g=BL.game;
  if(m.t==='start'){$('netbox').classList.add('hidden');$('menu').classList.add('hidden');g.startOnline(m.me,m.opp,m.seed);}
  else if(m.t==='shot')g.remoteShot(m);else if(m.t==='aim')g.remoteAim(m);else if(m.t==='place')g.remotePlace(m);
  else if(m.t==='result')g.remoteResult(m);else if(m.t==='over')g.onlineOver(m);
  else if(m.t==='err'){$('netbox').classList.add('hidden');BL.toast&&BL.toast('تعذّر التحقق من الحساب');}
}
function go(code){connect(ok=>{if(!ok)return;$('netTxt').textContent=code?'بانتظار صديقك في الغرفة «'+code+'»…':'جارٍ البحث عن خصم…';$('netbox').classList.remove('hidden');send({t:'queue',code});});}
BL.Net={send};
$('btnOnline').onclick=()=>go('');
$('btnRoom').onclick=()=>{const c=(prompt('أدخل كود الغرفة (مثلا 1234) وأعطِ الكود نفسه لصديقك')||'').trim();if(c)go(c);};
$('netCancel').onclick=()=>{send({t:'cancel'});$('netbox').classList.add('hidden');};
})(window.BL=window.BL||{});
