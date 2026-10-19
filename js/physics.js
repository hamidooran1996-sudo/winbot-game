/* المحرك الفيزيائي: احتكاك، تصادم كرات، ارتداد من الحواف، جيوب، دوران الكرة */
(function(BL){
const C=BL.C,W=C.W,H=C.H,R=C.R;
const TMP=new Array(9);
/* تدوير الكرة في الفضاء (مصفوفة 3x3) حول المحور w لمدة dt */
function spinBall(b,wx,wy,wz,dt){
  const w=Math.sqrt(wx*wx+wy*wy+wz*wz);if(w<1e-6)return;
  const th=w*dt,x=wx/w,y=wy/w,z=wz/w,c=Math.cos(th),s=Math.sin(th),t=1-c,m=b.m;
  const r0=t*x*x+c,r1=t*x*y-s*z,r2=t*x*z+s*y,r3=t*x*y+s*z,r4=t*y*y+c,r5=t*y*z-s*x,r6=t*x*z-s*y,r7=t*y*z+s*x,r8=t*z*z+c;
  for(let j=0;j<3;j++){TMP[j]=r0*m[j]+r1*m[3+j]+r2*m[6+j];TMP[3+j]=r3*m[j]+r4*m[3+j]+r5*m[6+j];TMP[6+j]=r6*m[j]+r7*m[3+j]+r8*m[6+j];}
  for(let i=0;i<9;i++)m[i]=TMP[i];b.rv++;
}
class Ball{
  constructor(id,x,y){this.id=id;this.x=x;this.y=y;this.vx=0;this.vy=0;this.sx=0;this.sy=0;this.active=true;this.wx=0;this.wy=0;this.m=[0,1,0,0,0,1,1,0,0];this.rv=0;spinBall(this,0,0,1,Math.random()*6.283,1);}
}
/* هندسة WPA من BL.GEOM: وسائد بمضلعات (حافة داخلية + وجها نهاية بزاوية قطع 142° للزاوية و104° للجانبي)،
   وفتحة الجيب دائرة تبعد "الرف" (shelf) عن خط الفم. تسقط الكرة فقط عندما يتجاوز مركزها حافة الفتحة (أكثر من 50% فوقها). */
const GM=BL.GEOM,E=v=>Math.max(.68,.84-v*.00005);   // ارتداد الحافة: نحو 0.8 ويقل قليلا مع السرعة
const pockets=GM.pockets.map(p=>({x:p.x,y:p.y,r:p.r,ax:(p.mouth[0][0]+p.mouth[1][0])/2,ay:(p.mouth[0][1]+p.mouth[1][1])/2}));   // ax,ay = منتصف الفم (نقطة التصويب)
const segs=[];
for(const c of GM.cush){const A=c[0],B=c[1],Cc=c[2],D=c[3];
  segs.push({ax:A[0],ay:A[1],bx:B[0],by:B[1]},{ax:B[0],ay:B[1],bx:Cc[0],by:Cc[1]},{ax:D[0],ay:D[1],bx:A[0],by:A[1]});
}
function cushion(b,ev){
  let hit=0;
  for(const s of segs){
    const dx=s.bx-s.ax,dy=s.by-s.ay;let t=((b.x-s.ax)*dx+(b.y-s.ay)*dy)/(dx*dx+dy*dy);t=t<0?0:t>1?1:t;
    const ex=b.x-(s.ax+dx*t),ey=b.y-(s.ay+dy*t),d=Math.hypot(ex,ey);
    if(d<R&&d>1e-6){
      const nx=ex/d,ny=ey/d,vn=b.vx*nx+b.vy*ny;b.x+=nx*(R-d);b.y+=ny*(R-d);
      if(vn<0){const e=E(-vn);b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny;hit=Math.max(hit,-vn);b.vx+=-ny*b.sx*(-vn)*.12;b.vy+=nx*b.sx*(-vn)*.12;}
    }
  }
  if(hit>25){ev.cushion(b,hit);b.sx*=.6;}
}
function pocket(b,ev){
  let k=-1;
  for(let i=0;i<pockets.length;i++){const p=pockets[i];if(Math.hypot(b.x-p.x,b.y-p.y)<p.r*.98){k=i;break;}}
  if(k<0&&(b.x<-R||b.x>W+R||b.y<-R||b.y>H+R)){let bd=1e9;pockets.forEach((p,i)=>{const d=Math.hypot(b.x-p.x,b.y-p.y);if(d<bd){bd=d;k=i;}});}
  if(k>=0){b.pvx=b.vx;b.pvy=b.vy;b.active=false;b.vx=b.vy=0;ev.pocket(b,pockets[k]);}
}

function collide(a,b,ev){
  const dx=b.x-a.x,dy=b.y-a.y,min=2*R,d2=dx*dx+dy*dy;
  if(d2>=min*min||d2===0)return;
  const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,o=(min-d)/2;
  a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;
  const vn=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
  if(vn<=0)return;
  const c=a.id===0?a:b.id===0?b:null;let dirx=0,diry=0;
  if(c){const s=Math.hypot(c.vx,c.vy)||1;dirx=c.vx/s;diry=c.vy/s;}
  const j=(1+C.REST_BALL)*vn/2;
  a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;
  if(c&&c.sy){c.vx+=dirx*c.sy*vn*.6;c.vy+=diry*c.sy*vn*.6;c.sy=0;}   // متابعة (+) أو سحب (−) للكرة البيضاء
  ev.hit(a,b,vn);
}

function step(balls,dt,ev){
  for(const b of balls){
    if(!b.active)continue;
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    const sp=Math.hypot(b.vx,b.vy);
    if(sp){let n=sp*(1-C.DAMP*dt)-C.FRICTION*dt;if(n<C.STOP){n=0;b.sx=b.sy=0;}const k=n/sp;b.vx*=k;b.vy*=k;}
    b.wx=-b.vy/R;b.wy=b.vx/R;spinBall(b,b.wx,b.wy,b.sx*10,dt);b.sx*=1-.35*dt;   // دوران بصري متوافق مع الحركة
    cushion(b,ev);pocket(b,ev);
  }
  for(let i=0;i<balls.length;i++){
    const a=balls[i];if(!a.active)continue;
    for(let j=i+1;j<balls.length;j++){const b=balls[j];if(b.active)collide(a,b,ev);}
  }
}

/* تتبّع شعاع التصويب: يعيد المسافة لأول كرة (مركز كرة الشبح) أو حافة الطاولة */
function ray(ox,oy,dx,dy,balls,skip){
  let best={t:1e9,ball:null};const D=2*R;
  for(const b of balls){
    if(!b.active||b===skip)continue;
    const fx=ox-b.x,fy=oy-b.y,B=fx*dx+fy*dy,c=fx*fx+fy*fy-D*D,q=B*B-c;
    if(q>=0){const t=-B-Math.sqrt(q);if(t>0&&t<best.t)best={t,ball:b};}
  }
  let tw=1e9;
  if(dx>0)tw=Math.min(tw,(W-R-ox)/dx);else if(dx<0)tw=Math.min(tw,(R-ox)/dx);
  if(dy>0)tw=Math.min(tw,(H-R-oy)/dy);else if(dy<0)tw=Math.min(tw,(R-oy)/dy);
  return tw<best.t?{t:tw,ball:null}:best;
}

BL.Ball=Ball;
BL.Physics={step,ray,pockets,segs};
})(window.BL=window.BL||{});