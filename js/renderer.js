/* الرسم: الطاولة (مخزّنة مؤقتاً)، الكرات، خط التصويب، العصا */
(function(BL){
const C=BL.C,R=C.R,TW=C.W+2*C.RAIL,TH=C.H+2*C.RAIL;
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

class Renderer{
  constructor(cv,stage){this.cv=cv;this.ctx=cv.getContext('2d');this.stage=stage;this.sprites=[];this.makeSprites();this.bg=new Image();this.bg.onload=()=>this.resize();this.bg.src='assets/table.png';this.resize();}

  resize(){   // الطاولة عمودية وتتكيف تلقائيا مع شاشة الهاتف
    const r=this.stage.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2.5);
    const cr=18,s=Math.max(.1,Math.min(r.width/(TH-2*cr),r.height/(TW-2*cr)));   // تكبير قليل: يُقصّ جزء من الإطار الخشبي
    this.scale=s;this.k=s*dpr;
    this.cv.style.width=TH*s+'px';this.cv.style.height=TW*s+'px';
    this.cv.width=Math.round(TH*this.k);this.cv.height=Math.round(TW*this.k);
    const L=document.createElement('canvas');L.width=Math.round(TW*this.k);L.height=Math.round(TH*this.k);if(this.bg&&this.bg.complete&&this.bg.naturalWidth)L.getContext('2d').drawImage(this.bg,0,0,L.width,L.height);else this.drawTable(L.getContext('2d'));
    this.layer=document.createElement('canvas');this.layer.width=this.cv.width;this.layer.height=this.cv.height;
    const p=this.layer.getContext('2d');p.setTransform(0,-1,1,0,0,L.width);p.drawImage(L,0,0);
  }
  toWorld(e){const r=this.cv.getBoundingClientRect(),s=this.scale;return{x:TW-C.RAIL-(e.clientY-r.top)/s,y:(e.clientX-r.left)/s-C.RAIL};}

  makeSprites(){
    const S=128,h=S/2;
    for(let id=0;id<=15;id++){
      const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
      const col=C.COLORS[id>8?id-8:id]||'#fff';
      g.beginPath();g.arc(h,h,h-1,0,7);g.clip();
      g.fillStyle=(id===0||id>8)?'#f6f3ea':col;g.fillRect(0,0,S,S);
      if(id>8){g.fillStyle=col;g.fillRect(0,S*.25,S,S*.5);}
      if(id>0){
        g.fillStyle='#fff';g.beginPath();g.arc(h,h,S*.2,0,7);g.fill();
        g.fillStyle='#111';g.font='bold '+S*.26+'px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(id,h,h+2);
      }
      const r=g.createRadialGradient(h*.7,h*.62,2,h,h,h);
      r.addColorStop(0,'rgba(255,255,255,.6)');r.addColorStop(.25,'rgba(255,255,255,0)');
      r.addColorStop(.7,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.45)');
      g.fillStyle=r;g.fillRect(0,0,S,S);
      this.sprites[id]=c;
    }
  }

  drawTable(g){
    const k=this.k,RL=C.RAIL,W=C.W,H=C.H,rnd=Math.random,m=W/2,t=20,gC=C.GAP_CORNER,gS=C.GAP_SIDE;
    g.setTransform(k,0,0,k,0,0);
    let gr=g.createLinearGradient(0,0,0,TH);gr.addColorStop(0,'#7b4526');gr.addColorStop(.5,'#5c3219');gr.addColorStop(1,'#43210d');
    g.fillStyle=gr;rr(g,0,0,TW,TH,34);g.fill();
    g.save();g.clip();   // عروق الخشب
    for(let i=0;i<500;i++){const x=rnd()*TW,y=rnd()*TH,l=40+rnd()*160;g.strokeStyle=rnd()<.5?'rgba(30,12,4,.16)':'rgba(255,190,120,.07)';g.lineWidth=.6+rnd()*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+l,y+(rnd()-.5)*3);g.stroke();}
    g.restore();
    g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=2;rr(g,3,3,TW-6,TH-6,31);g.stroke();
    g.setTransform(k,0,0,k,RL*k,RL*k);
    g.fillStyle='#14400f';g.fillRect(-14,-14,W+28,H+28);
    gr=g.createRadialGradient(m,H/2,40,m,H/2,W*.62);gr.addColorStop(0,'#2f7d1f');gr.addColorStop(1,'#1d5415');
    g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.save();g.globalAlpha=.07;for(let i=0;i<2600;i++){g.fillStyle=rnd()<.5?'#000':'#fff';g.fillRect(rnd()*W,rnd()*H,1.3,1.3);}g.restore();
    gr=g.createRadialGradient(m,H/2,H*.3,m,H/2,W*.62);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.38)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=1.5;g.beginPath();g.moveTo(W*.25,0);g.lineTo(W*.25,H);g.stroke();
    g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.arc(W*.72,H/2,3,0,7);g.fill();
    // وسائد مطاطية بنهايات مائلة عند الجيوب (مثل الصورة)
    const strip=(pts,x0,y0,x1,y1)=>{const f=g.createLinearGradient(x0,y0,x1,y1);f.addColorStop(0,'#44a52e');f.addColorStop(1,'#2a6f1d');
      g.fillStyle=f;g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<8;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.2;g.stroke();};
    const hs=(a,b,y,sg)=>strip([a,y,b,y,b-t*.9,y+sg*t,a+t*.9,y+sg*t],0,y,0,y+sg*t);
    const vs=(a,b,x,sg)=>strip([x,a,x,b,x+sg*t,b-t*.9,x+sg*t,a+t*.9],x,0,x+sg*t,0);
    hs(gC,m-gS,0,1);hs(m+gS,W-gC,0,1);hs(gC,m-gS,H,-1);hs(m+gS,W-gC,H,-1);vs(gC,H-gC,0,1);vs(gC,H-gC,W,-1);
    // مسامير فضية على الإطار
    const stud=(x,y)=>{const q=g.createRadialGradient(x-1.5,y-1.5,.5,x,y,7);q.addColorStop(0,'#f2f6fa');q.addColorStop(1,'#6f7f92');g.fillStyle=q;g.beginPath();g.arc(x,y,6.5,0,7);g.fill();};
    for(const f of[.15,.36,.64,.85]){stud(TW*f-RL,-RL/2);stud(TW*f-RL,H+RL/2);}
    for(const f of[.3,.695]){stud(-RL/2,TH*f-RL);stud(W+RL/2,TH*f-RL);}
    for(const p of BL.Physics.pockets){
      g.fillStyle='#030303';g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill();
      g.strokeStyle='#aab4c0';g.lineWidth=3.5;g.beginPath();g.arc(p.x,p.y,p.r+1.5,0,7);g.stroke();
    }
  }

  draw(game){
    const g=this.ctx,k=this.k;
    g.setTransform(1,0,0,1,0,0);g.drawImage(this.layer,0,0);
    g.setTransform(0,-k,k,0,C.RAIL*k,(TW-C.RAIL)*k);
    for(const b of game.balls){if(!b.active)continue;const sg=g.createRadialGradient(b.x+3,b.y+5,R*.4,b.x+3,b.y+5,R*1.3);sg.addColorStop(0,'rgba(0,0,0,.5)');sg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=sg;g.fillRect(b.x-R-5,b.y-R-5,2*R+16,2*R+16);}
    this.drawBalls(g,game);
    for(const s of game.sinking){
      const f=s.t,L=Math.hypot(s.vx,s.vy)||1,x=s.x+s.vx/L*R*.9*f+(s.px-s.x)*.3*f,y=s.y+s.vy/L*R*.9*f+(s.py-s.y)*.3*f,r=R*(1-f*.4);
      g.globalAlpha=1-f*.5;g.drawImage(this.sprites[s.id],x-r,y-r,2*r,2*r);g.globalAlpha=f*.8;g.fillStyle='#000';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.globalAlpha=1;
    }
    const c=game.cue,human=!game.players[game.cur]||!game.players[game.cur].cpu;
    if(game.state==='placing'&&human&&c.active){
      g.strokeStyle='#3ddc84';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();
      g.arc(c.x,c.y,R+5+Math.sin(performance.now()/200)*2,0,7);g.stroke();g.setLineDash([]);
    }
    if(game.state==='aiming'||game.state==='striking'){
      if(human&&game.state==='aiming'&&BL.guide!==false)this.aimGuide(g,game);
      this.stick(g,game);
    }
  }

  /* كرات ثلاثية الأبعاد: نسيج كروي يُدار بمصفوفة دوران كل كرة */
  buildFx(){
    const N=this.N=Math.max(24,Math.round(2*R*this.k));this.fxK=this.k;this.fx=[];
    const M=this.mask=new Float32Array(N*N*3),A=this.alpha=new Uint8Array(N*N);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const nx=(x+.5)/N*2-1,ny=(y+.5)/N*2-1,r2=nx*nx+ny*ny,i=y*N+x;
      if(r2<1){M[i*3]=nx;M[i*3+1]=ny;M[i*3+2]=Math.sqrt(1-r2);A[i]=Math.round(Math.min(1,(1-Math.sqrt(r2))*N*.5)*255);}
    }
    const c=this.shade=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),h=N/2;
    g.beginPath();g.arc(h,h,h,0,7);g.clip();
    const r=g.createRadialGradient(h*.7,h*.62,1,h,h,h);
    r.addColorStop(0,'rgba(255,255,255,.6)');r.addColorStop(.25,'rgba(255,255,255,0)');r.addColorStop(.7,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(0,0,0,.45)');
    g.fillStyle=r;g.fillRect(0,0,N,N);
  }
  makeTex(id){
    const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
    const col=C.COLORS[id>8?id-8:id]||'#fff';
    g.fillStyle=(id>0&&id<9)?col:'#f6f3ea';g.fillRect(0,0,256,128);
    if(id>8){g.fillStyle=col;g.fillRect(0,32,256,64);}
    if(id>0)for(const cx of[0,128,256]){
      g.fillStyle='#fff';g.beginPath();g.arc(cx,64,17,0,7);g.fill();
      g.fillStyle='#111';g.font='bold 22px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(id,cx,66);
    }else{g.fillStyle='#d33';for(const cx of[0,64,128,192,256]){g.beginPath();g.arc(cx,64,6,0,7);g.fill();}}
    return new Uint32Array(g.getImageData(0,0,256,128).data.buffer);
  }
  ballFx(b){
    if(this.fxK!==this.k)this.buildFx();
    let f=this.fx[b.id];
    if(!f){const cv=document.createElement('canvas');cv.width=cv.height=this.N;const ctx=cv.getContext('2d'),img=ctx.createImageData(this.N,this.N);
      f=this.fx[b.id]={cv,ctx,img,u:new Uint32Array(img.data.buffer),ver:-1,tex:this.makeTex(b.id)};}
    if(f.ver===b.rv)return f;
    const m=b.m,M=this.mask,A=this.alpha,u=f.u,t=f.tex,n=this.N*this.N;
    for(let i=0;i<n;i++){
      const a=A[i];if(!a){u[i]=0;continue;}
      const x=M[i*3],y=M[i*3+1],z=M[i*3+2];
      const ox=m[0]*x+m[3]*y+m[6]*z,oy=m[1]*x+m[4]*y+m[7]*z,oz=m[2]*x+m[5]*y+m[8]*z;
      const lon=Math.atan2(oy,ox),lat=Math.asin(oz>1?1:oz<-1?-1:oz);
      const tx=((lon*.15915494+.5)*256|0)&255,ty=Math.min(127,Math.max(0,(.5-lat*.31830989)*128|0));
      u[i]=(t[ty*256+tx]&0xffffff)|(a<<24);
    }
    f.ctx.putImageData(f.img,0,0);f.ver=b.rv;return f;
  }
  drawBalls(g,game){
    for(const b of game.balls){
      if(!b.active)continue;const f=this.ballFx(b);
      if(Math.hypot(b.vx,b.vy)>500){g.globalAlpha=.22;g.drawImage(f.cv,b.x-b.vx*.014-R,b.y-b.vy*.014-R,2*R,2*R);g.globalAlpha=1;}
      g.drawImage(f.cv,b.x-R,b.y-R,2*R,2*R);g.drawImage(this.shade,b.x-R,b.y-R,2*R,2*R);
    }
  }

  aimGuide(g,game){
    const c=game.cue,a=game.aim,dx=Math.cos(a),dy=Math.sin(a);
    const r=BL.Physics.ray(c.x,c.y,dx,dy,game.balls,c),gx=c.x+dx*r.t,gy=c.y+dy*r.t;
    g.lineWidth=1.1;g.strokeStyle='rgba(255,255,255,.85)';g.setLineDash([2,5]);g.shadowColor='rgba(120,255,200,.9)';g.shadowBlur=6*this.k;
    g.beginPath();g.moveTo(c.x+dx*R,c.y+dy*R);g.lineTo(gx,gy);g.stroke();g.setLineDash([]);
    g.beginPath();g.arc(gx,gy,R,0,7);g.stroke();g.shadowBlur=0;
    if(r.ball){
      const b=r.ball,nx=b.x-gx,ny=b.y-gy,l=Math.hypot(nx,ny)||1,ux=nx/l,uy=ny/l;
      g.strokeStyle='rgba(255,255,255,.9)';g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x+ux*70,b.y+uy*70);g.stroke();
      const dot=dx*ux+dy*uy,tx=dx-dot*ux,ty=dy-dot*uy,tl=Math.hypot(tx,ty)||1;
      g.strokeStyle='rgba(255,255,255,.4)';g.beginPath();g.moveTo(gx,gy);g.lineTo(gx+tx/tl*45,gy+ty/tl*45);g.stroke();
    }
  }

  stick(g,game){
    const c=game.cue,d=R+5+game.power*C.PULL,L=340;
    g.save();g.translate(c.x,c.y);g.rotate(game.aim);
    const gr=g.createLinearGradient(-d,0,-d-L,0),sk=BL.CUES.find(q=>q.id===BL.cueId&&(BL.plv||1)>=q.lv)||BL.CUES[0];
    gr.addColorStop(0,'#f2e8d0');gr.addColorStop(.03,sk.tip);gr.addColorStop(.04,sk.a);
    gr.addColorStop(.6,sk.b);gr.addColorStop(.61,sk.c);gr.addColorStop(1,sk.d);
    if(sk.glow){g.shadowColor=sk.glow;g.shadowBlur=12*this.k;}g.fillStyle=gr;g.beginPath();g.moveTo(-d,-1.6);g.lineTo(-d-L,-4.5);g.lineTo(-d-L,4.5);g.lineTo(-d,1.6);g.closePath();g.fill();
    g.restore();
  }
}
BL.Renderer=Renderer;
})(window.BL=window.BL||{});