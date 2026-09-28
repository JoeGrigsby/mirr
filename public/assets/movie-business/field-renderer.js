/* Field renderer — one shared set of dots that reorganizes for every mode. */
const cv=document.getElementById('cv'),g2=cv.getContext('2d'),relSvg=document.getElementById('rel'),tip=document.getElementById('tip');
let W=0,H=0,DPR=1,need=3,ORDER=[],VIS=[],PANELS=[],TREND=null,OUTR=[],REL=[],hov=null,hovPanel=null;
const P={x0:0,y0:0,x1:1,y1:1},PT={x0:0,y0:0,x1:1,y1:1},VZ={k:1,cx:.5,cy:.5},VT={k:1,cx:.5,cy:.5};
const CTXB=[[2008,2009,'Great Recession'],[2020,2021,'Pandemic'],[2023,2023,'Strikes']];
const TX='#F2EBDD',TX2='#BFB5A4',MU='#908677',AM='#E8A83E';
const isScatter=()=>S.mode==='explore'||S.mode==='time';
const REVENUE=new Set(['open','dom','intl','ww','ratio','legs']);for(const k of REVENUE)if(VARS[k])VARS[k].rev=true;
const REL_VARS=['budget','open','dom','intl','ww','tomato','popcorn','imdb','oscars','runtime','reviews'];
const BENCH={budget:'production budget',open:'opening weekend',genre:'genre'};

function plotTarget(){const nar=W<900,side=S.panel&&!nar?376:0,card=S.sel&&!nar&&S.mode!=='rel'?392:0;
 const l=side+(S.mode==='outliers'?86:S.mode==='compare'?40:82),r=W-card-(S.mode==='compare'?24:34),t=S.mode==='compare'?100:88,b=H-104-(S.mode==='compare'?34:50);
 PT.x0=l;PT.x1=Math.max(l+220,r);PT.y0=t;PT.y1=Math.max(t+160,b)}
const u0=()=>VZ.cx-.5/VZ.k,v0=()=>VZ.cy-.5/VZ.k;
const sx=u=>P.x0+(u-u0())*VZ.k*(P.x1-P.x0),sy=v=>P.y1-(v-v0())*VZ.k*(P.y1-P.y0);
const ux=px=>(px-P.x0)/((P.x1-P.x0)*VZ.k)+u0(),vy=py=>(P.y1-py)/((P.y1-P.y0)*VZ.k)+v0();
function tv(V,f){const x=V.f(f);if(x==null||!isFinite(x))return NaN;if(V.log)return x>0?Math.log10(x):NaN;return x}
function corr(list,X,Y){let n=0,a=0,b=0,aa=0,bb=0,ab=0;for(const f of list){if(f.streaming&&(X.rev||Y.rev))continue;const p=tv(X,f),q=tv(Y,f);if(!isFinite(p)||!isFinite(q))continue;n++;a+=p;b+=q;aa+=p*p;bb+=q*q;ab+=p*q}
 if(n<3)return null;const vx=aa-a*a/n,vyy=bb-b*b/n,c=ab-a*b/n;if(vx<=1e-12||vyy<=1e-12)return {r:0,n,b:0,a:b/n};const sl=c/vx;return {r:c/Math.sqrt(vx*vyy),n,b:sl,a:(b-sl*a)/n}}
function passes(f,skip){for(const k in S.hide){if(k!==skip&&S.hide[k].size&&S.hide[k].has(catOf(k,f)))return false}return true}
const median=a=>{const s=a.filter(v=>v!=null&&isFinite(v)).sort((x,y)=>x-y);if(!s.length)return NaN;const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
function divCol(l2){const st=[[-2,[216,67,58]],[-1,[232,128,62]],[-.35,[240,184,102]],[0,[233,223,200]],[.35,[156,203,138]],[1,[63,184,143]],[2,[47,143,208]]];l2=clamp(l2,-2,2);
 for(let i=1;i<st.length;i++)if(l2<=st[i][0]){const [a,ca]=st[i-1],[b,cb]=st[i],t=(l2-a)/(b-a);return 'rgb('+ca.map((c,j)=>Math.round(c+(cb[j]-c)*t)).join(',')+')'}return 'rgb(47,143,208)'}

function retarget(){plotTarget();const m=S.mode,C=COLORBY[S.color];VIS=[];PANELS=[];TREND=null;OUTR=[];
 for(const f of FILMS){f.ok=passes(f);f.win=f.year>=S.yr[0]&&f.year<=S.yr[1];f.col=C.col(catOf(S.color,f))}
 const X=VARS[S.x],Y=VARS[S.y],dx=DOMAIN[S.x],dy=DOMAIN[S.y];
 if(m==='explore'||m==='time'||m==='rel'){const SV=VARS[S.size],mx=SZMAX[S.size]||1;
  for(const f of FILMS){const a=tv(X,f),b=tv(Y,f),ok=isFinite(a)&&isFinite(b);if(ok){f.tu=(a-dx[0])/(dx[1]-dx[0]);f.tv=(b-dy[0])/(dy[1]-dy[0])}
   f.tr=S.size==='none'?3.2:1.4+10*Math.sqrt(Math.max(0,SV.f(f)||0)/mx);
   let al=ok&&f.ok?(f.win?.86:(m==='time'&&S.layers.ghosts?.07:0)):0;if(m==='rel')al=ok&&f.ok&&f.win?.06:0;f.ta=al;if(ok&&f.ok&&f.win)VIS.push(f)}
  S.stat=corr(VIS,X,Y);TREND=S.stat;
  if(S.stat)for(const f of VIS)f.res=tv(Y,f)-(S.stat.a+S.stat.b*tv(X,f));
  OUTR=VIS.filter(f=>isFinite(f.res)&&!f.streaming).sort((a,b)=>Math.abs(b.res)-Math.abs(a.res)).slice(0,6);
  if(m==='rel')relPairs()}
 else if(m==='compare'){const D=COLORBY[S.split],gs=D.cats.map((c,i)=>({c,col:D.colors[i],fs:[]}));
  for(const f of FILMS){f.ta=0;if(!f.ok||!f.win)continue;const a=tv(X,f),b=tv(Y,f);if(!isFinite(a)||!isFinite(b))continue;const g=gs[D.cats.indexOf(catOf(S.split,f))];if(g)g.fs.push(f)}
  const G=gs.filter(g=>g.fs.length>=3),n=G.length||1,pw=PT.x1-PT.x0,ph=PT.y1-PT.y0;let best=1,bs=0;
  for(let c=1;c<=n;c++){const rws=Math.ceil(n/c),s=Math.min(pw/c,ph/rws*1.25);if(s>bs){bs=s;best=c}}
  const cols=best,rows=Math.ceil(n/cols),gu=24/pw,gv=34/ph,w=(1-gu*(cols-1))/cols,h=(1-gv*rows)/rows;
  G.forEach((g,i)=>{const col=i%cols,row=Math.floor(i/cols),pu0=col*(w+gu),top=row*(h+gv)+gv,pv1=1-top,pv0=pv1-h;
   const st=corr(g.fs,X,Y);PANELS.push({c:g.c,col:g.col,n:g.fs.length,u0:pu0,u1:pu0+w,v0:pv0,v1:pv1,st});
   for(const f of g.fs){f.tu=pu0+(tv(X,f)-dx[0])/(dx[1]-dx[0])*w;f.tv=pv0+(tv(Y,f)-dy[0])/(dy[1]-dy[0])*h;f.tr=S.size==='none'?2:1+5.5*Math.sqrt(Math.max(0,VARS[S.size].f(f)||0)/(SZMAX[S.size]||1));f.ta=.85;VIS.push(f)}})}
 else if(m==='outliers'){const ok=FILMS.filter(f=>f.ok&&f.win&&f.ww>0&&!f.streaming),lw=f=>Math.log10(f.ww);
  for(const f of FILMS){f.res=NaN;f.ta=0}
  if(S.bench==='genre'){const mu={};for(const g of GENRES){const a=ok.filter(f=>f.genre===g).map(lw);mu[g]=a.reduce((s,v)=>s+v,0)/(a.length||1)}for(const f of ok)f.res=lw(f)-mu[f.genre]}
  else{const B=VARS[S.bench],st=corr(ok,B,VARS.ww);S.bstat=st;if(st)for(const f of ok){const b=tv(B,f);if(isFinite(b))f.res=lw(f)-(st.a+st.b*b)}}
  const pw=PT.x1-PT.x0,ph=PT.y1-PT.y0,colW=pw/25*.9,okr=ok.filter(f=>isFinite(f.res));for(const f of okr){f.l2=f.res*3.3219;f._v=(clamp(f.l2,-2.45,2.45)+2.5)/5}
  const inner=okr.filter(f=>Math.abs(f.l2)<=2.45);let row=6;for(;row>3.4;row-=.4){const c={};let mx=0;for(const f of inner){const k=f.year+'|'+Math.round(f._v/(row/ph));c[k]=(c[k]||0)+1;if(c[k]>mx)mx=c[k]}if(mx*row<=colW)break}
  const dv=row/ph,du=row/pw,bins={},perRow=Math.max(1,Math.floor(colW/row));
  for(const f of okr){const ri=Math.round(f._v/dv),key=f.year+'|'+ri;(bins[key]=bins[key]||[]).push(f);f.col=divCol(f.l2);f.tr=row*.44;f.ta=.92;VIS.push(f);f._ri=ri}
  for(const k in bins){const b=bins[k].sort((a,c)=>a.l2-c.l2),y=b[0].year,dir=b[0]._v<.5?1:-1,nr=Math.ceil(b.length/perRow);b.forEach((f,i)=>{const r=Math.floor(i/perRow),inRow=r<nr-1?perRow:b.length-r*perRow,c=i%perRow;f.tu=(y-2001+.5)/25+(c-(inRow-1)/2)*du;f.tv=(f._ri+dir*r)*dv})}
  OUTR=VIS.slice().sort((a,b)=>b.l2-a.l2)}
 if(S.focus)for(const f of FILMS)if(f.ta>.3&&!S.focus.has(f.id))f.ta=.1;
 ORDER=FILMS.slice().sort((a,b)=>b.tr-a.tr);need=3}

function relPairs(){REL=[];const pool=FILMS.filter(f=>f.ok&&f.win),V=REL_VARS.map(k=>VARS[k]);for(let i=0;i<V.length;i++)for(let j=i+1;j<V.length;j++){const st=corr(pool,V[i],V[j]);if(st)REL.push({a:REL_VARS[i],b:REL_VARS[j],r:st.r,n:st.n})}REL.sort((p,q)=>Math.abs(q.r)-Math.abs(p.r))}

function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';retarget();Object.assign(P,PT);if(S.mode==='rel')buildRel();need=3}

let lastT=0;function frame(){requestAnimationFrame(frame);step()}
setInterval(()=>{if(performance.now()-lastT>90)step()},33);
function step(){lastT=performance.now();let mv=0;
 for(const k in PT){const d=PT[k]-P[k];if(Math.abs(d)>.3){P[k]+=d*.16;mv=1}else P[k]=PT[k]}
 for(const k of ['k','cx','cy']){const d=VT[k]-VZ[k];if(Math.abs(d)>1e-4*(k==='k'?10:1)){VZ[k]+=d*.14;mv=1}else VZ[k]=VT[k]}
 for(const f of FILMS){const du=f.tu-f.u,dv=f.tv-f.v,dr=f.tr-f.r,da=f.ta-f.a;
  if(Math.abs(du)+Math.abs(dv)>2e-4||Math.abs(dr)>.02||Math.abs(da)>.004){f.u+=du*f.sp;f.v+=dv*f.sp;f.r+=dr*.14;f.a+=da*.12;mv=1}else{f.u=f.tu;f.v=f.tv;f.r=f.tr;f.a=f.ta}}
 if(!mv&&!need)return;need=Math.max(0,need-1);draw()}

function ticks(V,d,a0,a1){const a=d[0]+a0*(d[1]-d[0]),b=d[0]+a1*(d[1]-d[0]),out=[];
 if(V.log){const sp=b-a,mult=sp>2.4?[1]:sp>1.2?[1,3]:[1,2,5];for(let e=Math.floor(a)-1;e<=Math.ceil(b);e++)for(const m of mult){const t=e+Math.log10(m);if(t>=a&&t<=b)out.push(t)}}
 else{const st=niceStep((b-a)/6);for(let t=Math.ceil(a/st)*st;t<=b+1e-9;t+=st)out.push(+t.toFixed(6))}
 return out.map(t=>({u:(t-d[0])/(d[1]-d[0]),lab:V.ax(V.log?10**t:t)}))}
function niceStep(x){const e=10**Math.floor(Math.log10(x)),f=x/e;return (f<1.5?1:f<3?2:f<7?5:10)*e}
function ln(x1,y1,x2,y2){g2.beginPath();g2.moveTo(x1,y1);g2.lineTo(x2,y2);g2.stroke()}
function capsText(t,x,y,sz,col,al){g2.font='800 '+sz+'px Archivo';g2.fillStyle=col;g2.textAlign=al||'left';if('letterSpacing' in g2)g2.letterSpacing=(sz*.14).toFixed(1)+'px';g2.fillText(t.toUpperCase(),x,y);if('letterSpacing' in g2)g2.letterSpacing='0px'}

function drawAxes(){const X=VARS[S.x],Y=VARS[S.y];g2.lineWidth=1;g2.font='500 12px Archivo';
 if(S.x==='year'&&S.layers.context)drawBandsX(DOMAIN.year);
 for(const t of ticks(X,DOMAIN[S.x],u0(),u0()+1/VZ.k)){const x=sx(t.u);if(x<P.x0-1||x>P.x1+1)continue;g2.strokeStyle='rgba(236,224,196,.07)';ln(x,P.y0,x,P.y1);g2.fillStyle=TX2;g2.textAlign='center';g2.fillText(t.lab,x,P.y1+20)}
 for(const t of ticks(Y,DOMAIN[S.y],v0(),v0()+1/VZ.k)){const y=sy(t.u);if(y<P.y0-1||y>P.y1+1)continue;g2.strokeStyle='rgba(236,224,196,.07)';ln(P.x0,y,P.x1,y);g2.fillStyle=TX2;g2.textAlign='right';g2.fillText(t.lab,P.x0-10,y+4)}
 g2.strokeStyle='rgba(236,224,196,.3)';ln(P.x0,P.y1,P.x1,P.y1);ln(P.x0,P.y0,P.x0,P.y1);
 capsText(X.label+(X.log?' · log scale':''),(P.x0+P.x1)/2,P.y1+42,11,TX,'center');
 g2.save();g2.translate(P.x0-64,(P.y0+P.y1)/2);g2.rotate(-Math.PI/2);capsText(Y.label+(Y.log?' · log scale':''),0,0,11,TX,'center');g2.restore();
 if(S.mode==='time'){g2.font='76px Anton';g2.fillStyle='rgba(242,235,221,.13)';g2.textAlign='left';g2.fillText(S.yr[0]===S.yr[1]?S.yr[0]:S.yr[0]+'–'+S.yr[1],P.x0+20,P.y0+84)}}
function drawBandsX(d){for(const [a,b,lab] of CTXB){const ua=(a-.5-d[0])/(d[1]-d[0]),ub=(b+.5-d[0])/(d[1]-d[0]),x0=Math.max(P.x0,sx(ua)),x1=Math.min(P.x1,sx(ub));if(x1<=x0)continue;g2.fillStyle='rgba(236,224,196,.045)';g2.fillRect(x0,P.y0,x1-x0,P.y1-P.y0);capsText(lab,(x0+x1)/2,P.y0+14,9.5,TX2,'center')}}

function drawTrend(st,pu0,pu1,pv0,pv1){if(!st)return;const dx=DOMAIN[S.x],dy=DOMAIN[S.y],pts=[];
 for(let i=0;i<=40;i++){const u=i/40,x=dx[0]+u*(dx[1]-dx[0]),v=(st.a+st.b*x-dy[0])/(dy[1]-dy[0]);if(v>=-.02&&v<=1.02)pts.push([pu0+u*(pu1-pu0),pv0+v*(pv1-pv0)])}
 if(pts.length<2)return;g2.save();g2.setLineDash([6,5]);g2.strokeStyle='rgba(242,235,221,.55)';g2.lineWidth=1.4;g2.beginPath();pts.forEach(([u,v],i)=>i?g2.lineTo(sx(u),sy(v)):g2.moveTo(sx(u),sy(v)));g2.stroke();g2.restore();return pts[pts.length-1]}

function drawCompare(){const X=VARS[S.x],Y=VARS[S.y];
 for(const p of PANELS){const x0=sx(p.u0),x1=sx(p.u1),y0=sy(p.v1),y1=sy(p.v0);g2.fillStyle=p===hovPanel?'rgba(236,224,196,.06)':'rgba(236,224,196,.022)';g2.fillRect(x0,y0,x1-x0,y1-y0);g2.strokeStyle=p===hovPanel?'rgba(232,168,62,.6)':'rgba(236,224,196,.12)';g2.lineWidth=1;g2.strokeRect(x0+.5,y0+.5,x1-x0-1,y1-y0-1);
  g2.fillStyle=p.col;g2.beginPath();g2.arc(x0+5,y0-12,4,0,7);g2.fill();capsText(x1-x0<150&&p.c.length>9?p.c.slice(0,8)+'…':p.c,x0+15,y0-8,11,TX);
  g2.font='600 12px Archivo';g2.textAlign='right';g2.fillStyle=TX2;g2.fillText((p.st?'r = '+fmtR(p.st.r):'—')+(x1-x0>200?'  ·  '+p.n+' films':''),x1,y0-8)}
 capsText('Each panel  ·  across: '+X.label+(X.log?' (log)':'')+'  ·  up: '+Y.label+(Y.log?' (log)':''),P.x0,P.y1+26,10,MU)}

function drawOutFrame(){const cw=(P.x1-P.x0)/25;g2.lineWidth=1;
 if(S.layers.context)for(const [a,b,lab] of CTXB){const x0=P.x0+(a-2001)*cw,x1=P.x0+(b-2001+1)*cw;g2.fillStyle='rgba(236,224,196,.05)';g2.fillRect(x0,P.y0,x1-x0,P.y1-P.y0);capsText(lab,(x0+x1)/2,P.y0+14,9.5,TX2,'center')}
 for(const [l2,lab] of [[-2,'−75%'],[-1,'−50%'],[0,'As expected'],[1,'+100%'],[2,'+300%']]){const y=sy((l2+2.5)/5);g2.strokeStyle=l2?'rgba(236,224,196,.07)':'rgba(236,224,196,.38)';ln(P.x0,y,P.x1,y);g2.font=(l2?'500':'700')+' 12px Archivo';g2.fillStyle=l2?TX2:TX;g2.textAlign='right';g2.fillText(lab,P.x0-10,y+4)}
 g2.font='500 12px Archivo';g2.textAlign='center';g2.fillStyle=TX2;for(let y=2001;y<=2025;y++){if(cw<34&&(y-2001)%2)continue;g2.fillText(cw<40?'’'+String(y).slice(2):y,P.x0+(y-2001+.5)*cw,P.y1+20)}
 capsText('▲ Outperformed · earned more than expected',P.x0,P.y0-12,10,'#6FD0A8');capsText('▼ Underperformed · earned less than expected',P.x0,P.y1+40,10,'#F08A5E')}

function fmtR(r){return (r>=0?'+':'−')+Math.abs(r).toFixed(2)}
function ov(a,b){return a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3]}
function drawLabels(list,max){const boxes=[];let c=0;g2.font='600 12px Archivo';g2.textAlign='left';g2.lineJoin='round';
 for(const f of list){if(c>=max)break;if(!f||!f.sr||f.a<.3)continue;const t=f.title||('Record '+f.rec),w=g2.measureText(t).width;let x=f.sx+f.sr+5;if(x+w>P.x1+10)x=f.sx-f.sr-5-w;const bx=[x-2,f.sy-9,w+4,14];if(boxes.some(b=>ov(b,bx)))continue;boxes.push(bx);c++;
  g2.globalAlpha=Math.min(1,f.a+.15);g2.strokeStyle='rgba(14,12,11,.85)';g2.lineWidth=3.5;g2.strokeText(t,x,f.sy+4);g2.fillStyle=f.title?TX:TX2;g2.fillText(t,x,f.sy+4)}g2.globalAlpha=1}

function draw(){g2.setTransform(DPR,0,0,DPR,0,0);g2.clearRect(0,0,W,H);const m=S.mode;
 if(isScatter())drawAxes();else if(m==='compare')drawCompare();else if(m==='outliers')drawOutFrame();
 g2.save();if(isScatter()){g2.beginPath();g2.rect(P.x0-8,P.y0-8,P.x1-P.x0+16,P.y1-P.y0+16);g2.clip()}
 if(isScatter()&&S.layers.trend){const e=drawTrend(TREND,0,1,0,1);}
 if(m==='compare'&&S.layers.trend)for(const p of PANELS){g2.save();g2.beginPath();g2.rect(sx(p.u0),sy(p.v1),sx(p.u1)-sx(p.u0),sy(p.v0)-sy(p.v1));g2.clip();drawTrend(p.st,p.u0,p.u1,p.v0,p.v1);g2.restore()}
 const zk=isScatter()?Math.min(2.2,Math.sqrt(VZ.k)):1;
 // career paths: each selected person's films joined in release order
 if(isScatter()&&S.people&&S.people.length)S.people.forEach((p,i)=>{const fs=p.ids.map(id=>FILMS[id]).filter(f=>f.a>.3).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.year-b.year);if(fs.length<2)return;
  g2.save();g2.globalAlpha=.5;g2.strokeStyle=PCOL[i];g2.lineWidth=1.3;g2.beginPath();fs.forEach((f,k)=>{const x=sx(f.u),y=sy(f.v);k?g2.lineTo(x,y):g2.moveTo(x,y)});g2.stroke();g2.restore()});
 for(const f of ORDER){f.sr=0;if(f.a<.012)continue;const x=sx(f.u),y=sy(f.v),r=Math.max(.6,f.r*zk);if(x<P.x0-30||x>P.x1+30||y<P.y0-30||y>P.y1+30)continue;f.sx=x;f.sy=y;f.sr=r;
  g2.globalAlpha=f.a;if(f.streaming){const lw=Math.max(1.3,r*.34);g2.strokeStyle=f.col;g2.lineWidth=lw;g2.beginPath();g2.arc(x,y,Math.max(1,r-lw/2),0,6.2832);g2.stroke()}else{g2.fillStyle=f.col;g2.beginPath();g2.arc(x,y,r,0,6.2832);g2.fill();if(r>3.4){g2.strokeStyle='rgba(14,12,11,.6)';g2.lineWidth=.8;g2.stroke()}}}
 g2.globalAlpha=1;
 if(S.people&&S.people.length)S.people.forEach((p,i)=>{for(const id of p.ids){const f=FILMS[id];if(!f.sr||f.a<.3)continue;const both=S.people.length>1&&S.people[1-i].ids.includes(id);g2.strokeStyle=both?'#F2EBDD':PCOL[i];g2.lineWidth=1.8;g2.beginPath();g2.arc(f.sx,f.sy,f.sr+2.6+(i&&both?2.4:0),0,7);g2.stroke()}});
 if(isScatter()&&S.layers.outl)for(const f of OUTR){if(!f.sr)continue;g2.strokeStyle=AM;g2.lineWidth=1.3;g2.beginPath();g2.arc(f.sx,f.sy,f.sr+5,0,7);g2.stroke()}
 const sel=S.sel;
 if(sel&&S.nb&&isScatter())for(const n of S.nb){if(!n.sr||!sel.sr)continue;g2.strokeStyle='rgba(232,168,62,.55)';g2.lineWidth=1.1;ln(sel.sx,sel.sy,n.sx,n.sy);g2.strokeStyle=AM;g2.beginPath();g2.arc(n.sx,n.sy,n.sr+3,0,7);g2.stroke()}
 if(sel&&sel.sr&&isScatter()&&!S.nb){g2.save();g2.setLineDash([3,4]);g2.strokeStyle='rgba(242,235,221,.45)';g2.lineWidth=1;ln(sel.sx,sel.sy,sel.sx,P.y1);ln(sel.sx,sel.sy,P.x0,sel.sy);g2.restore();
  chip(VARS[S.x].fmt(VARS[S.x].f(sel)),sel.sx,P.y1-11,'center');chip(VARS[S.y].fmt(VARS[S.y].f(sel)),P.x0+4,sel.sy,'left')}
 if(sel&&sel.sr){g2.strokeStyle='#fff';g2.lineWidth=2;g2.beginPath();g2.arc(sel.sx,sel.sy,sel.sr+3.5,0,7);g2.stroke()}
 if(hov&&hov.sr&&hov!==sel){g2.strokeStyle='rgba(255,255,255,.8)';g2.lineWidth=1.4;g2.beginPath();g2.arc(hov.sx,hov.sy,hov.sr+3,0,7);g2.stroke()}
 const ppl=S.people&&S.people.length?S.people.flatMap(p=>p.ids.map(id=>FILMS[id])).sort((a,b)=>(b.ww||0)-(a.ww||0)):null;
 if(S.layers.labels||sel||ppl){let L=[];if(sel)L.push(sel);if(S.nb)L=L.concat(S.nb);if(ppl)L=L.concat(ppl);
  if(S.layers.labels){const nm=ORDER.filter(f=>f.named&&(!S.focus||S.focus.has(f.id))).reverse();if(m==='outliers')L=L.concat(OUTR.filter(f=>f.named).slice(0,4),OUTR.filter(f=>f.named).slice(-4).reverse(),nm);else if(isScatter()){if(S.layers.outl)L=L.concat(OUTR);L=L.concat(nm)}}
  drawLabels(L,m==='compare'?6:m==='outliers'?14:36)}
 g2.restore()}
function chip(t,x,y,al){g2.font='700 11px Archivo';const w=g2.measureText(t).width+12;const x0=al==='center'?x-w/2:x;g2.fillStyle=AM;g2.beginPath();g2.roundRect?g2.roundRect(x0,y-9,w,18,9):g2.rect(x0,y-9,w,18);g2.fill();g2.fillStyle='#0E0C0B';g2.textAlign='left';g2.fillText(t,x0+6,y+4)}

function hit(x,y){let best=null,bd=1e9;for(const f of FILMS){if(!f.sr||f.a<.25)continue;const d=Math.hypot(f.sx-x,f.sy-y);if(d<f.sr+4){const s=d-f.sr*.5;if(s<bd){bd=s;best=f}}}return best}
function panelAt(x,y){return PANELS.find(p=>x>=sx(p.u0)&&x<=sx(p.u1)&&y>=sy(p.v1)&&y<=sy(p.v0))||null}

function showTip(html,x,y){tip.innerHTML=html;tip.classList.add('on');const w=tip.offsetWidth,h=tip.offsetHeight;let l=x+16,t=y+16;if(l+w>W-10)l=x-w-16;if(t+h>H-10)t=y-h-16;tip.style.left=l+'px';tip.style.top=t+'px'}
function hideTip(){tip.classList.remove('on')}
function filmTip(f){const X=VARS[S.x],Y=VARS[S.y];let rows;
 if(S.mode==='outliers')rows=[['Worldwide',fmtM(f.ww)],['Vs. expected',(f.l2>=0?'+':'−')+Math.abs(Math.round((2**f.l2-1)*100))+'%'],['Benchmark',BENCH[S.bench]]];
 else rows=[[X.label,X.fmt(X.f(f))],[Y.label,Y.fmt(Y.f(f))]];
 return `<b>${esc(f.title)}</b><div class="tm">${f.year} · ${esc(f.genre)}</div>${rows.map(r=>`<div class="tr"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}`}

let drag=null;
cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:VT.cx,cy:VT.cy,moved:false};cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{const x=e.clientX,y=e.clientY;
 if(drag){if(Math.abs(x-drag.x)+Math.abs(y-drag.y)>4)drag.moved=true;if(drag.moved&&isScatter()&&VZ.k>1.01){VT.cx=VZ.cx=clamp(drag.cx-(x-drag.x)/((P.x1-P.x0)*VZ.k),0,1);VT.cy=VZ.cy=clamp(drag.cy+(y-drag.y)/((P.y1-P.y0)*VZ.k),0,1);cv.classList.add('panning');hideTip();need=2;return}}
 const f=hit(x,y);if(f!==hov){hov=f;need=2}
 if(S.mode==='compare'){const p=f?null:panelAt(x,y);if(p!==hovPanel){hovPanel=p;need=2}}
 cv.style.cursor=f||hovPanel?'pointer':(isScatter()&&VZ.k>1.01?'grab':'default');
 if(f)showTip(filmTip(f),x,y);else if(hovPanel)showTip(`<b>${hovPanel.c}</b><div class="tm">${hovPanel.n} films · r = ${hovPanel.st?fmtR(hovPanel.st.r):'—'}</div><div class="tm">Click to explore this group alone</div>`,x,y);else hideTip()});
cv.addEventListener('pointerleave',()=>{hov=null;hovPanel=null;hideTip();need=2});
cv.addEventListener('pointerup',e=>{const d=drag;drag=null;cv.classList.remove('panning');if(!d||d.moved)return;const f=hit(e.clientX,e.clientY);
 if(f)selectFilm(f);else if(S.mode==='compare'&&hovPanel)isolateGroup(S.split,hovPanel.c);else if(S.sel||S.focus)clearSel()});
cv.addEventListener('wheel',e=>{if(!isScatter())return;e.preventDefault();zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0016))},{passive:false});
cv.addEventListener('dblclick',()=>{if(isScatter())resetZoom()});
function zoomAt(x,y,fac){const u=ux(x),v=vy(y),k=clamp(VZ.k*fac,1,30);VZ.k=VT.k=k;VZ.cx=VT.cx=clamp(u-(x-P.x0)/((P.x1-P.x0)*k)+.5/k,0,1);VZ.cy=VT.cy=clamp(v-(P.y1-y)/((P.y1-P.y0)*k)+.5/k,0,1);if(k===1){VZ.cx=VT.cx=.5;VZ.cy=VT.cy=.5}need=3}
function resetZoom(){VT.k=1;VT.cx=.5;VT.cy=.5;need=3}

/* Relationship map (SVG) */
const NS='http://www.w3.org/2000/svg';
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
const SHORT={budget:'Production Budget',open:'Opening Weekend',dom:'Domestic Gross',intl:'International Gross',ww:'Worldwide Gross',tomato:'Tomatometer',popcorn:'Popcornmeter',imdb:'IMDb Rating',oscars:'Oscar Nominations',runtime:'Runtime',reviews:'Critic Reviews'};
function strength(r){const a=Math.abs(r);return (a<.1?'No meaningful':a<.3?'Weak':a<.5?'Moderate':a<.7?'Strong':'Very strong')+(a<.1?'':r>0?' positive':' negative')}
function buildRel(){relSvg.innerHTML='';const cx=(PT.x0+PT.x1)/2,cy=(PT.y0+PT.y1)/2+6,rx=Math.max(120,Math.min((PT.x1-PT.x0)/2-140,440)),ry=Math.max(90,Math.min((PT.y1-PT.y0)/2-24,300)),pos={};
 REL_VARS.forEach((k,i)=>{const a=-Math.PI/2+i/REL_VARS.length*Math.PI*2;pos[k]=[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,a]});
 el('text',{x:cx,y:cy-6,'text-anchor':'middle',class:'rc1'},relSvg).textContent='What travels together?';
 el('text',{x:cx,y:cy+16,'text-anchor':'middle',class:'rc2'},relSvg).textContent='Hover a line · click to open it in the field';
 const gE=el('g',{},relSvg),gN=el('g',{},relSvg);
 const edges=[];
 for(const p of REL.slice().reverse()){if(Math.abs(p.r)<S.relT)continue;const [x1,y1]=pos[p.a],[x2,y2]=pos[p.b],mx=(x1+x2)/2,my=(y1+y2)/2,qx=mx+(cx-mx)*.35,qy=my+(cy-my)*.35,d=`M${x1} ${y1}Q${qx} ${qy} ${x2} ${y2}`,a=Math.abs(p.r);
  const g=el('g',{class:'edge'},gE);g.dataset.a=p.a;g.dataset.b=p.b;el('path',{d,fill:'none',stroke:p.r>0?AM:'#6FA8DC','stroke-width':(.6+a**1.5*11).toFixed(2),'stroke-opacity':(.18+a*.6).toFixed(2),'stroke-linecap':'round',class:'vis'},g);el('path',{d,fill:'none',stroke:'transparent','stroke-width':14},g);
  g.addEventListener('pointermove',e=>{relHi(p.a,p.b);showTip(`<b>${VARS[p.a].label} ↔ ${VARS[p.b].label}</b><div class="tr"><span>r</span><span>${fmtR(p.r)}</span></div><div class="tm">${strength(p.r)} relationship · ${p.n.toLocaleString()} films</div><div class="tm">Click to open in the field</div>`,e.clientX,e.clientY)});
  g.addEventListener('pointerleave',()=>{relHi();hideTip()});g.addEventListener('click',()=>openPair(p.a,p.b));edges.push(g)}
 for(const k of REL_VARS){const [x,y,a]=pos[k],g=el('g',{class:'node'},gN);g.dataset.k=k;el('circle',{cx:x,cy:y,r:7,fill:'#0E0C0B',stroke:TX,'stroke-width':1.6},g);
  const c=Math.cos(a),s=Math.sin(a),t=el('text',{x:x+c*16,y:y+s*16+4,'text-anchor':Math.abs(c)<.25?'middle':c>0?'start':'end',class:'nl'},g);if(Math.abs(c)<.25)t.setAttribute('y',y+s*20+(s>0?10:-2));t.textContent=SHORT[k];
  g.addEventListener('pointerenter',()=>relHi(k));g.addEventListener('pointerleave',()=>relHi())}}
function relHi(a,b){relSvg.classList.toggle('hi',!!a);relSvg.querySelectorAll('.edge').forEach(g=>{const on=b?(g.dataset.a===a&&g.dataset.b===b):(g.dataset.a===a||g.dataset.b===a);g.classList.toggle('on',!!a&&on)});relSvg.querySelectorAll('.node').forEach(n=>n.classList.toggle('on',!!a&&(n.dataset.k===a||n.dataset.k===b||(!b&&REL.some(p=>Math.abs(p.r)>=S.relT&&((p.a===a&&p.b===n.dataset.k)||(p.b===a&&p.a===n.dataset.k)))))))}
