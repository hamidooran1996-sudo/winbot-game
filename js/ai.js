/* ذكاء الكمبيوتر: يختار كرة وجيباً بطريقة "كرة الشبح" مع هامش خطأ بسيط */
(function(BL){
const C=BL.C,R=C.R;
function clear(g,ax,ay,bx,by,i1,i2){
  const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
  return g.balls.every(b=>{
    if(!b.active||b===i1||b===i2)return true;
    let t=((b.x-ax)*dx+(b.y-ay)*dy)/l2;t=Math.max(0,Math.min(1,t));
    return Math.hypot(ax+dx*t-b.x,ay+dy*t-b.y)>2*R-2;
  });
}
BL.AI={plan(g){
  const c=g.cue,me=g.players[g.cur],G=BL.grp;
  const own=me.group?g.balls.filter(b=>b.active&&G(b.id)===me.group).length:0;
  const targets=g.balls.filter(b=>b.active&&b.id>0&&(me.group?(own?G(b.id)===me.group:b.id===8):b.id!==8));
  let best=null;
  for(const t of targets)for(const p of BL.Physics.pockets){
    let ux=p.ax-t.x,uy=p.ay-t.y;const d2=Math.hypot(ux,uy);ux/=d2;uy/=d2;
    const gx=t.x-ux*2*R,gy=t.y-uy*2*R;
    if(gx<R||gx>C.W-R||gy<R||gy>C.H-R)continue;
    const cx=gx-c.x,cy=gy-c.y,d1=Math.hypot(cx,cy);if(d1<1)continue;
    const cos=(cx*ux+cy*uy)/d1;if(cos<.35)continue;
    if(!clear(g,c.x,c.y,gx,gy,c,t)||!clear(g,t.x,t.y,p.ax,p.ay,t,null))continue;
    const score=d1+d2*.7+(1-cos)*400;
    if(!best||score<best.score)best={score,angle:Math.atan2(cy,cx),power:Math.max(.35,Math.min(.9,.3+(d1+d2)/1500))};
  }
  if(!best){
    const t=targets.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0]||g.balls.find(b=>b.active&&b.id);
    best={angle:Math.atan2(t.y-c.y,t.x-c.x),power:.55};
  }
  if(g.shots===0)best.power=.95;
  const L=BL.level||'normal';
  best.angle+=(Math.random()-.5)*({easy:.12,normal:.03,hard:.006}[L]||.03);
  if(L==='easy')best.power=Math.max(.3,Math.min(1,best.power*(1+(Math.random()-.5)*.35)));
  return best;
}};
})(window.BL=window.BL||{});