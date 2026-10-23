/* منطق اللعبة: قواعد 8-ball، الأدوار، الأخطاء، الكرة في اليد، الفوز */
(function(BL){
const C=BL.C,P=BL.Physics,grp=BL.grp,A=BL.Audio;
const AR={solid:'المصمتة',stripe:'المخططة'};

class Game{
  constructor(ui){
    this.ui=ui;this.players=[];this.cur=0;this.state='menu';this.aim=0;this.power=0;
    this.spin={x:0,y:0};this.acc=0;this.timer=0;this.shots=0;this.sinking=[];
    this.turn={first:null,pocketed:[],cleared:false};
    this.ev={
      hit:(a,b,v)=>{if(this.turn.first===null&&(a.id===0||b.id===0))this.turn.first=a.id===0?b.id:a.id;A.hit(v);BL.haptic&&v>300&&BL.haptic("light");},
      cushion:(b,v)=>A.cushion(v),
      pocket:(b,p)=>{this.turn.pocketed.push(b.id);this.sinking.push({id:b.id,x:b.x,y:b.y,px:p.x,py:p.y,vx:b.pvx||1,vy:b.pvy||0,t:0});A.pocket();BL.haptic&&BL.haptic("medium");}
    };
    this.rack();
  }
  get cue(){return this.balls[0];}

  rack(seed){
    const R=C.R,b=this.balls=[new BL.Ball(0,C.W*.25,C.H/2)];
    let sd=seed||Math.floor(Math.random()*2147483647);const rnd=()=>{sd=(sd*1664525+1013904223)%4294967296;return sd/4294967296;};
    const ids=[1,2,3,4,5,6,7,9,10,11,12,13,14,15];for(let i=ids.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}ids.splice(4,0,8);   // الكرة 8 في المنتصف
    const fx=C.W*.75,fy=C.H/2,dx=R*1.7321+.3,dy=2*R+.3;let i=0;
    for(let c=0;c<5;c++)for(let r=0;r<=c;r++)b.push(new BL.Ball(ids[i++],fx+c*dx,fy+(r-c/2)*dy));
    this.sinking=[];
  }

  start(mode){if(this.net)BL.Net.send({t:"leave"});this.net=false;this.winner=undefined;
    this.players=[{name:BL.pname||'اللاعب 1',group:null,cpu:false},{name:mode==='cpu'?'الكمبيوتر':'اللاعب 2',group:null,cpu:mode==='cpu'}];
    BL.level=(document.getElementById('level')||{}).value||'normal';
    this.cur=0;this.shots=0;this.aim=0;this.spin={x:0,y:0};this.rack();this.begin('aiming');
    this.ui.toast('ابدأ بالكسر!');
  }

  begin(s){const pv=this.state;this.state=s;if(this.net&&pv==="placing"&&s==="aiming"&&this.players[this.cur]&&!this.players[this.cur].remote)BL.Net.send({t:"place",x:+this.cue.x.toFixed(2),y:+this.cue.y.toFixed(2)});this.power=0;this.timer=0;this.cpuPlan=null;this.ui.refresh(this);}

  valid(x,y){
    if(x<C.R||x>C.W-C.R||y<C.R||y>C.H-C.R)return false;
    if(P.pockets.some(p=>Math.hypot(p.x-x,p.y-y)<p.r+C.R))return false;
    return this.balls.every(b=>b.id===0||!b.active||Math.hypot(b.x-x,b.y-y)>=2*C.R);
  }
  tryPlace(x,y){if(this.valid(x,y)){this.cue.x=x;this.cue.y=y;}}
  placeAuto(){
    for(let r=0;r<80;r++){
      const x=C.W*.25+(Math.random()-.5)*r*8,y=C.H/2+(Math.random()-.5)*r*6;
      if(this.valid(x,y)){this.cue.active=true;this.cue.x=x;this.cue.y=y;this.cue.vx=this.cue.vy=0;return;}
    }
  }

  strike(p){if(this.state!=='aiming')return;this.power=p;this.anim={t:0,p};this.state='striking';}

  shoot(p){
    if(this.net&&!this.players[this.cur].remote){p=+p.toFixed(4);this.aim=+this.aim.toFixed(4);this.spin={x:+this.spin.x.toFixed(3),y:+this.spin.y.toFixed(3)};BL.Net.send({t:"shot",aim:this.aim,power:p,spin:this.spin});}
    const c=this.cue,me=this.players[this.cur],v=p*C.MAX_POWER;
    c.vx=Math.cos(this.aim)*v;c.vy=Math.sin(this.aim)*v;c.sx=this.spin.x;c.sy=this.spin.y;
    this.turn={first:null,pocketed:[],cleared:!!me.group&&!this.balls.some(b=>b.active&&grp(b.id)===me.group)};
    this.spin={x:0,y:0};this.power=0;this.state='rolling';this.acc=0;this.shots++;
    this.ui.refresh(this);A.cue(p);
  }

  update(dt){
    if(this.net&&this.state==='aiming'&&this.players[this.cur]&&!this.players[this.cur].remote){this.nt=(this.nt||0)+dt;if(this.nt>.12){this.nt=0;BL.Net.send({t:"aim",aim:+this.aim.toFixed(4),power:+this.power.toFixed(3)});}}
    this.sinking=this.sinking.filter(s=>(s.t+=dt*4)<1);
    const s=this.state,cpu=this.players[this.cur]&&this.players[this.cur].cpu&&!this.players[this.cur].remote;
    if(s==='striking'){
      const a=this.anim;a.t+=dt;const f=Math.min(1,a.t/.09);this.power=a.p*(1-f*f);
      if(f>=1)this.shoot(a.p);
    }else if(s==='rolling'){
      this.acc+=Math.min(dt,.05);
      while(this.acc>=C.STEP){P.step(this.balls,C.STEP,this.ev);this.acc-=C.STEP;}
      if(this.balls.every(b=>!b.active||(b.vx===0&&b.vy===0))){
        if(this.net&&this.players[this.cur].remote){this.settled=true;this.tryApply();}
        else{this.endTurn();if(this.net)this.sendResult();}
      }
    }else if(s==='aiming'&&cpu)this.cpuUpdate(dt);
    else if(s==='placing'&&cpu){this.timer+=dt;if(this.timer>.8){this.placeAuto();this.begin('aiming');}}
  }

  say(m){this.lastMsg=m;this.ui.toast(m);}
  /* ===== أونلاين: الضارب يحاكي ويرسل النتيجة النهائية، والخصم يحاكي نفس الضربة ثم يتطابق مع النتيجة ===== */
  startOnline(idx,opp,seed){
    if(this.net)BL.Net.send({t:"leave"});
    const me={name:BL.pname||'أنت',group:null,cpu:false},op={name:opp.name+' · '+opp.elo,group:null,cpu:true,remote:true};
    this.players=idx===0?[me,op]:[op,me];this.net=true;this.myIdx=idx;this.winner=undefined;this.pend=null;this.settled=false;
    this.cur=0;this.shots=0;this.aim=0;this.spin={x:0,y:0};this.rack(seed);this.begin('aiming');
    this.ui.toast(idx===0?'أنت تكسر أولا — حظا موفقا!':'الخصم يكسر أولا');
  }
  remoteAim(m){if(this.net&&this.players[this.cur].remote&&this.state==='aiming'){this.aim=m.aim;this.power=m.power||0;}}
  remoteShot(m){if(this.net&&this.players[this.cur].remote&&this.state==='aiming'){this.aim=m.aim;this.spin=m.spin||{x:0,y:0};this.strike(m.power);}}
  remotePlace(m){if(this.net&&this.players[this.cur].remote&&this.state==='placing'){this.cue.active=true;this.cue.x=m.x;this.cue.y=m.y;this.begin('aiming');}}
  remoteResult(m){this.pend=m;this.tryApply();}
  tryApply(){
    const m=this.pend;if(!m)return;
    if((this.state==='rolling'||this.state==='striking')&&!this.settled)return;
    this.pend=null;this.settled=false;this.sinking=[];
    m.balls.forEach((b,i)=>{const B=this.balls[i];if(!B)return;B.x=b[0];B.y=b[1];B.active=!!b[2];B.vx=B.vy=B.wx=B.wy=B.sx=0;});
    this.players[0].group=m.g[0];this.players[1].group=m.g[1];this.cur=m.cur;
    if(m.w!==null&&m.w!==undefined){this.state='ended';this.winner=m.w;this.ui.refresh(this);this.ui.showEnd(this.players[m.w].name,m.why||'');return;}
    if(m.msg)this.ui.toast(m.msg);this.begin(m.st);
  }
  sendResult(){BL.Net.send({t:"result",balls:this.balls.map(b=>[+b.x.toFixed(2),+b.y.toFixed(2),b.active?1:0]),cur:this.cur,st:this.state,g:[this.players[0].group,this.players[1].group],msg:this.lastMsg||'',w:this.state==='ended'?this.winner:null,why:this.why||''});this.lastMsg='';}
  onlineOver(m){
    if(this.state!=='ended'){this.state='ended';this.ui.refresh(this);this.ui.showEnd(this.players[m.winner].name,m.why==='left'?'غادر الخصم المباراة':'انتهت المباراة');}
    window.dispatchEvent(new CustomEvent('net:over',{detail:m}));
  }
  cpuUpdate(dt){
    this.timer+=dt;const t=this.timer;
    if(!this.cpuPlan){if(t>.9){this.cpuPlan=BL.AI.plan(this);this.timer=0;}return;}
    const pl=this.cpuPlan,d=Math.atan2(Math.sin(pl.angle-this.aim),Math.cos(pl.angle-this.aim));
    this.aim+=d*Math.min(1,dt*8);
    if(t>.6&&t<1.3)this.power=pl.power*(t-.6)/.7;
    else if(t>=1.3)this.strike(pl.power);
  }

  endTurn(){
    const t=this.turn,me=this.players[this.cur],op=this.players[1-this.cur],cue=this.cue;
    const pk=t.pocketed.filter(i=>i),scratch=!cue.active;
    let foul=null;
    if(scratch)foul='دخلت الكرة البيضاء الجيب';
    else if(t.first===null)foul='لم تلمس البيضاء أي كرة';
    else{
      const f=grp(t.first),need=me.group?(t.cleared?'eight':me.group):null;
      if(need?f!==need:f==='eight')foul='لمست كرة غير صحيحة أولاً';
    }
    if(pk.includes(8)){
      const win=!foul&&me.group&&t.cleared;
      return this.end(win?this.cur:1-this.cur,win?'أدخل الكرة 8 بنجاح':'دخلت الكرة 8 قبل الأوان أو بخطأ');
    }
    let msg='';
    if(!me.group&&!foul){
      const f=pk.find(i=>i!==8);
      if(f){me.group=grp(f);op.group=me.group==='solid'?'stripe':'solid';msg=me.name+': الكرات '+AR[me.group];}
    }
    const mine=!!me.group&&pk.some(i=>grp(i)===me.group);
    if(foul){
      this.cur=1-this.cur;
      if(scratch)this.placeAuto();
      this.say('خطأ: '+foul+' — الكرة البيضاء في يد '+this.players[this.cur].name);
      this.begin('placing');
    }else{
      if(!mine)this.cur=1-this.cur;
      this.say(msg||(mine?'أحسنت! أكمل دورك':'دور '+this.players[this.cur].name));
      this.begin('aiming');
    }
  }

  end(w,msg){this.winner=w;this.why=msg;window.dispatchEvent(new CustomEvent('game:end',{detail:{winner:w,cpu:!!this.players[1].cpu,level:BL.level,online:!!this.net}}));this.state='ended';this.ui.refresh(this);this.ui.showEnd(this.players[w].name,msg);}
}
BL.Game=Game;
})(window.BL=window.BL||{});