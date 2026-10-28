/* أصوات احترافية بالتوليف: رنين كرات + ضوضاء مفلترة + صدى غرفة صغير + ضاغط ديناميكي */
(function(BL){
let ctx=null,muted=false,out=null,nb=null;
function ac(){
  if(!ctx){
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A();
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=20;comp.ratio.value=5;
    out=ctx.createGain();out.gain.value=(BL.Audio&&BL.Audio._v!=null)?BL.Audio._v:.9;
    const rv=ctx.createConvolver(),n=ctx.sampleRate*.45|0,ir=ctx.createBuffer(2,n,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,4);}
    rv.buffer=ir;const wet=ctx.createGain();wet.gain.value=.16;
    out.connect(comp);out.connect(rv);rv.connect(wet);wet.connect(comp);comp.connect(ctx.destination);
    nb=ctx.createBuffer(1,ctx.sampleRate*.5|0,ctx.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }
  if(ctx.state==='suspended')ctx.resume();return ctx;
}
const G=(c,t,v,dur)=>{const g=c.createGain();g.gain.setValueAtTime(Math.max(.0001,Math.min(v,1)),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.connect(out);return g;};
function tone(f,dur,v,w,type,slide){
  if(muted)return;const c=ac();if(!c)return;const t=c.currentTime+(w||0),o=c.createOscillator();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+dur);
  o.connect(G(c,t,v,dur));o.start(t);o.stop(t+dur+.02);
}
function noise(dur,f,q,v,type,w){
  if(muted)return;const c=ac();if(!c)return;const t=c.currentTime+(w||0),s=c.createBufferSource(),fl=c.createBiquadFilter();
  s.buffer=nb;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;s.connect(fl);fl.connect(G(c,t,v,dur));s.start(t,Math.random()*.3);s.stop(t+dur+.02);
}
/* نموذج صوتي فيزيائي: نبضة نصف جيبية بمدة التلامس τ تُثير رنّانات الكرة والطاولة.
   كرة-كرة τ≈0.2-0.4 مللي ث (أقصر مع السرعة)، رأس العصا ≈1 مللي ث، الوسادة المطاطية عدة مللي ث. */
const vel=(s,m)=>Math.pow(Math.min(1,s/m),.65),PC={};
function pulse(c,tau){const n=Math.max(3,Math.round(tau*c.sampleRate));if(!PC[n]){const b=c.createBuffer(1,n+2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.sin(Math.PI*i/n);PC[n]=b;}return PC[n];}
function strike(tau,modes,vol,w,pitch){
  if(muted)return;const c=ac();if(!c)return;const t=c.currentTime+(w||0),src=c.createBufferSource();src.buffer=pulse(c,tau);
  modes.forEach(m=>{const f=m[0]*(pitch||1),q=m[1],bp=c.createBiquadFilter(),g=c.createGain(),comp=q/(2*Math.PI*f*tau*.6366);   // تعويض ليكون ذروة كل نمط = vol×gain
    bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;g.gain.setValueAtTime(Math.min(1.5,vol*m[2]*comp),t);g.gain.exponentialRampToValueAtTime(.0001,t+m[3]);src.connect(bp);bp.connect(g);g.connect(out);});
  src.start(t);
}
BL.Audio={
  unlock:ac,
  hit(s){const v=vel(s,2600),p=.96+Math.random()*.08;   // نقرة كرتين راتنجيتين
    strike(.00036-.00022*v,[[1250,5,.45,.06],[2650,9,.85,.04],[4350,12,.5,.025],[6900,14,.2,.014]],.25+.75*v,0,p);},
  cushion(s){const v=vel(s,2200),p=.95+Math.random()*.1;   // ارتطام مطاط: تلامس أطول → صوت أخفض
    strike(.0035,[[150,3,.9,.13],[330,4,.5,.09],[950,5,.22,.05]],.2+.8*v,0,p);},
  pocket(){strike(.006,[[115,2.5,.8,.22],[270,3,.5,.13]],.8);   // سقوط + ارتطام بالشبكة ثم تدحرج في مجرى الكرات
    [.14,.23,.33,.46,.6].forEach((w,i)=>strike(.0003,[[2500,9,.7,.03],[1300,5,.4,.05]],.2/(i+1),w,.9+Math.random()*.2));noise(.55,650,1.2,.1,'bandpass',.16);},
  cue(p){const t=.0013-.0006*p;strike(t,[[210,3,.6,.09],[900,6,.8,.05],[2100,8,.45,.03]],.25+.75*p);},   // ضربة رأس العصا ≈1 مللي ث
  ui(){tone(660,.05,.12,0,'triangle');tone(990,.07,.08,.03,'triangle');},
  coin(){tone(1320,.09,.18,0,'square');tone(1760,.18,.16,.08,'square');},
  level(){[523,659,784,1047].forEach((f,i)=>tone(f,.25,.2,i*.09,'triangle'));},
  win(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,.2,i*.1,'triangle'));},
  lose(){[392,330,262].forEach((f,i)=>tone(f,.3,.16,i*.14,'sawtooth',-20));},
  toggle(){muted=!muted;return muted;}
};
/* ===== أصوات حقيقية (اختيارية): ضع ملفات WAV/MP3 في assets/sounds واذكرها في manifest.json، فتُستخدم تلقائيا بدل التوليف ===== */
const SM={};let sampled=false;
async function loadSamples(){
  if(sampled)return;sampled=true;const c=ac();if(!c)return;
  try{const r=await fetch('assets/sounds/manifest.json');if(!r.ok)return;const man=await r.json();
    for(const k of Object.keys(man))for(const f of man[k]){try{const rr=await fetch('assets/sounds/'+f);if(rr.ok)(SM[k]=SM[k]||[]).push(await c.decodeAudioData(await rr.arrayBuffer()));}catch(e){}}}catch(e){}
}
function sample(k,vol,rate){
  const l=SM[k];if(!l||!l.length||muted)return false;const c=ac(),s=c.createBufferSource(),g=c.createGain();
  s.buffer=l[Math.random()*l.length|0];s.playbackRate.value=rate||1;g.gain.value=Math.min(1,vol);s.connect(g);g.connect(out);s.start();return true;
}
const A=BL.Audio,sh=A.hit,sc=A.cushion,sp=A.pocket,sq=A.cue;
A.vol=v=>{A._v=v;if(out)out.gain.value=v;};
A.unlock=()=>{const c=ac();loadSamples();return c;};
A.hit=s=>{const v=vel(s,2600);if(!sample('hit',.2+.8*v,.97+.06*Math.random()))sh(s);};
A.cushion=s=>{const v=vel(s,2200);if(!sample('cushion',.2+.8*v,.96+.08*Math.random()))sc(s);};
A.pocket=()=>{if(!sample('pocket',.9,.98+.04*Math.random()))sp();};
A.cue=p=>{if(!sample('cue',.3+.7*p,.97+.06*Math.random()))sq(p);};
})(window.BL=window.BL||{});
