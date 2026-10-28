/* التحكم باللمس والماوس: التصويب، شريط القوة، الدوران، وضع الكرة البيضاء */
(function(BL){
BL.bindInput=function(game,renderer,els){
  const cv=renderer.cv;let mode=null,a0=null,aim0=0;
  const human=()=>game.players[game.cur]&&!game.players[game.cur].cpu;

  cv.addEventListener('pointerdown',e=>{
    BL.Audio.unlock();if(!human())return;
    const p=renderer.toWorld(e);
    if(game.state==='placing'){mode='place';cv.setPointerCapture(e.pointerId);game.tryPlace(p.x,p.y);}
    else if(game.state==='aiming'){mode='aim';a0=null;aim0=game.aim;cv.setPointerCapture(e.pointerId);}
  });
  cv.addEventListener('pointermove',e=>{
    if(!mode)return;const p=renderer.toWorld(e),c=game.cue;
    if(mode==='place'){game.tryPlace(p.x,p.y);return;}
    if(Math.hypot(p.x-c.x,p.y-c.y)<20)return;
    const a=Math.atan2(p.y-c.y,p.x-c.x);
    if(a0===null){a0=a;aim0=game.aim;}
    game.aim=aim0+(a-a0);                      // دوران نسبي: كلما ابتعد الإصبع زادت الدقة
  });
  const up=()=>{if(mode==='place'&&game.state==='placing')game.begin('aiming');mode=null;};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();game.aim+=Math.sign(e.deltaY)*.003;},{passive:false});
  window.addEventListener('keydown',e=>{
    if(game.state!=='aiming'||!human())return;
    if(e.key==='ArrowLeft')game.aim-=e.shiftKey?.001:.004;
    if(e.key==='ArrowRight')game.aim+=e.shiftKey?.001:.004;
  });

  /* شريط القوة: اسحب للأسفل ثم أفلت للتسديد */
  const pw=els.power;let drag=false;
  const setP=e=>{const r=pw.getBoundingClientRect();game.power=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));};
  pw.addEventListener('pointerdown',e=>{if(game.state!=='aiming'||!human())return;drag=true;pw.setPointerCapture(e.pointerId);setP(e);});
  pw.addEventListener('pointermove',e=>{if(drag)setP(e);});
  const rel=()=>{if(!drag)return;drag=false;const p=game.power;if(p>.04)game.strike(p);else game.power=0;};
  pw.addEventListener('pointerup',rel);pw.addEventListener('pointercancel',rel);

  /* لوحة الدوران: أعلى = تتبّع، أسفل = سحب، يمين/يسار = دوران جانبي */
  const sp=els.spin;let sd=false;
  const setS=e=>{
    const r=sp.getBoundingClientRect(),h=r.width/2;
    let x=(e.clientX-r.left-h)/h,y=(e.clientY-r.top-h)/h;const l=Math.hypot(x,y);
    if(l>.8){x*=.8/l;y*=.8/l;}
    game.spin={x:x/.8,y:-y/.8};
  };
  sp.addEventListener('pointerdown',e=>{sd=true;sp.setPointerCapture(e.pointerId);setS(e);});
  sp.addEventListener('pointermove',e=>{if(sd)setS(e);});
  sp.addEventListener('pointerup',()=>sd=false);sp.addEventListener('pointercancel',()=>sd=false);
};
})(window.BL=window.BL||{});