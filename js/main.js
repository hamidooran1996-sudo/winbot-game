/* نقطة الدخول: واجهة HUD، الحلقة الرئيسية، القوائم */
(function(BL){
const $=id=>document.getElementById(id);
const AR={solid:'المصمتة 1-7',stripe:'المخططة 9-15'};
let toastT;
const ui={
  refresh(g){
    [0,1].forEach(i=>{
      const p=g.players[i],el=$('p'+i);if(!p)return;
      el.querySelector('.name').textContent=p.name;
      el.querySelector('.grp').textContent=p.group?AR[p.group]:'الطاولة مفتوحة';
      el.classList.toggle('active',g.cur===i&&g.state!=='ended');
      const tr=el.querySelector('.tray');tr.innerHTML='';
      if(p.group)g.balls.filter(b=>b.id&&BL.grp(b.id)===p.group).sort((a,b)=>a.id-b.id).forEach(b=>{
        const s=document.createElement('i');s.style.backgroundImage='url('+BL.ballImg(b.id)+')';if(!b.active)s.style.opacity=.25;tr.appendChild(s);
      });
    });
    const p=g.players[g.cur],s=g.state;
    $('status').textContent=!p?'':s==='placing'?(p.cpu?p.name+' يضع الكرة…':'اسحب لوضع الكرة البيضاء'):
      s==='aiming'?(p.cpu?p.name+' يفكّر…':'دور '+p.name):s==='rolling'?'…':'';
  },
  toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800);},
  showEnd(name,msg){$('menuTitle').textContent='🏆 فاز '+name;$('menuMsg').textContent=msg;$('btnResume').classList.add('hidden');$('menu').classList.remove('hidden');}
};

const game=new BL.Game(ui),renderer=new BL.Renderer($('table'),$('stage'));BL.game=game;
const _bi=[];BL.ballImg=id=>_bi[id]||(_bi[id]=renderer.sprites[id].toDataURL());
BL.bindInput(game,renderer,{power:$('power'),spin:$('spin')});

document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
  BL.Audio.unlock();$('menu').classList.add('hidden');game.start(b.dataset.mode);
});
$('btnMenu').onclick=()=>{
  $('menuTitle').textContent='🎱 بلياردو 8';$('menuMsg').textContent='ابدأ مباراة جديدة أو تابع المباراة الحالية.';
  $('btnResume').classList.toggle('hidden',!(game.state!=='menu'&&game.state!=='ended'));$('menu').classList.remove('hidden');
};
$('btnResume').onclick=()=>$('menu').classList.add('hidden');
$('btnSound').onclick=()=>{$('btnSound').textContent=BL.Audio.toggle()?'🔇':'🔊';};
$('rotateClose').onclick=()=>$('rotate').classList.add('hidden');

const onResize=()=>renderer.resize();
window.addEventListener('resize',onResize);window.addEventListener('orientationchange',()=>setTimeout(onResize,200));
if(window.ResizeObserver)new ResizeObserver(onResize).observe($('stage'));
document.addEventListener('contextmenu',e=>e.preventDefault());

const knob=$('knob'),dot=$('spinDot'),pw=$('power');let last=performance.now();
function loop(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  if($('menu').classList.contains('hidden')&&!BL.paused)game.update(dt);
  renderer.draw(game);
  const p=game.players[game.cur],can=game.state==='aiming'&&p&&!p.cpu;
  pw.classList.toggle('off',!can&&game.state!=='striking');
  knob.style.top=game.power*100+'%';
  dot.style.left=50+game.spin.x*40+'%';dot.style.top=50-game.spin.y*40+'%';
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})(window.BL=window.BL||{});