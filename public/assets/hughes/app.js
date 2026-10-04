(async function(){
// Shorter film labels for the Films list so every row fits on one line; cards keep the full titles.
const SHORT_TITLE={'Planes, Trains and Automobiles':'Planes, Trains & Autos','Home Alone 2: Lost in New York':'Home Alone 2','National Lampoon’s Vacation':'Vacation','National Lampoon’s Christmas Vacation':'Christmas Vacation'};
const MEDIA=(window.__HMEDIA||fetch('assets/hughes/media.json').then(r=>r.json())).catch(()=>({}));let MI={},MF={};MEDIA.then(j=>{MI=j.items||{};MF=j.films||{};try{if(S.card)renderCard()}catch(_){}});
const [data,geo]=await Promise.all([window.__HDATA||fetch('assets/hughes/data.json').then(r=>r.json()),window.__HGEO||fetch('assets/hughes/geo.json').then(r=>r.json())]);data.geo=geo;
const {el,glyph}=HMap;
const F=Object.fromEntries(data.films.map(f=>[f.id,f]));
const P=Object.fromEntries(data.places.map(p=>[p.id,p]));
const C=Object.fromEntries(data.cards.map(c=>[c.id,c]));
const L=data.locations,LI=Object.fromEntries(L.map(l=>[l.id,l]));
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const svg=$('#map'),app=$('#app');
const M=HMap.build(svg,data);
const cloud=HMap.shermerCloud(svg,M.lab);
const cardsG=HMap.cards(svg,data,null);
const routeG=el('g',{class:'route'},svg);
const leadG=el('g',{class:'leaders'},svg);const pinsG=el('g',{class:'pins'},svg);const leadEl={};let TGT={};
const hd=el('g',{id:'hd',class:'hd'},svg,HMap.mascot());

// ---------- targets ----------
const base={};
const byPlace={};
L.forEach(l=>{if(l.xy){base[l.id]=l.xy;return}if(l.shot&&l.shot.card)return;(byPlace[l.place]=byPlace[l.place]||[]).push(l)});
Object.entries(byPlace).forEach(([pid,arr])=>{const p=P[pid];const e=p.edge?(p.xy[1]>1100?-Math.PI/2:p.xy[1]<120?Math.PI/2:p.xy[0]<200?0:Math.PI/2):null;arr.forEach((l,k)=>{if(e!=null){const a=e+(k-(arr.length-1)/2)*.5,r=34;base[l.id]=[p.xy[0]+Math.cos(a)*r*(e===0?2.2:1),p.xy[1]+Math.sin(a)*r];return}const a=Math.PI/2+k*2.39996,r=24+7.5*Math.sqrt(k);base[l.id]=[p.xy[0]+Math.cos(a)*r,p.xy[1]+Math.sin(a)*r*0.9+8]})});
function rawTargets(layer){const T={},inCard={};
L.forEach(l=>{let card=null,xy=null;
if(layer===0){if(l.screen.world==='shermer')xy=l.screen.xy;else if(l.screen.world==='elsewhere')card=l.screen.card;else xy=base[l.id]||l.screen.xy}
else{if(l.shot&&l.shot.card)card=l.shot.card;else xy=base[l.id]}
if(card){(inCard[card]=inCard[card]||[]).push(l.id)}else T[l.id]=[xy[0],xy[1],false]});
Object.entries(inCard).forEach(([cid,ids])=>{const [cx,cy]=C[cid].xy;ids.forEach((id,i)=>{T[id]=[cx+(i-(ids.length-1)/2)*27,cy+25,true,cid]})});
return {T,cards:Object.keys(inCard)};}
function obstacles(layer){let r=data.places.filter(p=>!(layer===0&&p.region==='north')).map(p=>p._rect);r=r.concat(M.obs);if(layer===0)r.push([356,370,504,388]);return r}
const RC=new Map();
function relax(layer,vis){const ck=layer+'|'+[...vis].sort().join(',');if(RC.has(ck))return RC.get(ck);const r=relax0(layer,vis);RC.set(ck,r);return r}
function relax0(layer,vis){const {T,cards}=rawTargets(layer);const obs=obstacles(layer);
const pts=Object.keys(T).filter(id=>vis.has(id)).map((id,i)=>{const t=T[id];return{id,x:t[0]+Math.cos(i*2.4)*2,y:t[1]+Math.sin(i*2.4)*2,tx:t[0],ty:t[1],fixed:t[2]}});
const isLoop=id=>{const l=LI[id];return l&&l.place==='loop'};pts.forEach(p=>{p.loop=!p.fixed&&isLoop(p.id)});
const MIN=32,MINL=46;
for(let it=0;it<220;it++){let mv=0;for(let i=0;i<pts.length;i++){const a=pts[i];for(let j=i+1;j<pts.length;j++){const b=pts[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);{const mn=(a.loop||b.loop)?MINL:MIN;if(d>=mn)continue;if(d<.01){dx=Math.cos(i+j);dy=Math.sin(i+j);d=1}const m=(mn-d)/2/d;mv+=mn-d;if(!a.fixed){a.x-=dx*m;a.y-=dy*m}if(!b.fixed){b.x+=dx*m;b.y+=dy*m}}}}
pts.forEach(p=>{if(p.fixed){p.x=p.tx;p.y=p.ty;return}const kk=p.loop?.012:.035;p.x+=(p.tx-p.x)*kk;p.y+=(p.ty-p.y)*kk;obs.forEach(r=>{const x0=r[0]-11,x1=r[2]+11,y0=r[1]-11,y1=r[3]+11;if(p.x>x0&&p.x<x1&&p.y>y0&&p.y<y1){const dl=p.x-x0,dr=x1-p.x,du=p.y-y0,dd=y1-p.y,m=Math.min(dl,dr,du,dd);if(m===du)p.y=y0;else if(m===dd)p.y=y1;else if(m===dl)p.x=x0;else p.x=x1}});const sx=HMap.shoreX(p.y)-10;if(p.x>sx&&!['glencoe-beach','meigs'].includes(p.id))p.x=sx;p.x=Math.max(46,Math.min(1054,p.x));p.y=Math.max(46,Math.min(1254,p.y))});if(it>40&&mv<.5)break}
const out={},tgt={};pts.forEach(p=>{out[p.id]=[p.x,p.y];if(!p.fixed)tgt[p.id]=[p.tx,p.ty]});Object.keys(T).forEach(id=>{if(!out[id])out[id]=[T[id][0],T[id][1]]});return {pos:out,cards,tgt,oncard:Object.keys(T).filter(id=>T[id][2])};}

// ---------- state ----------
const S={layer:1,films:new Set(data.films.map(f=>f.id)),sel:null,focus:null,card:null,panel:true,tour:null};
if(!(S.layer>=0&&S.layer<=2))S.layer=1;
const cur={};let POS={};
const visIds=()=>new Set(L.filter(l=>l.films.some(a=>S.films.has(a.f))).map(l=>l.id));

// ---------- pins ----------
const STATUS={standing:'Standing',private:'Standing · private residence',demolished:'Demolished',changed:'Changed',unknown:'Unconfirmed'};
const pinEl={};
L.forEach(l=>{const c=F[l.films[0].f].color;const g=el('g',{class:'pin st-'+l.now.s,'data-id':l.id,'data-c':c,'data-f':l.films.map(x=>x.f).join(','),tabindex:0,role:'button','aria-label':l.name},pinsG);
let dots='';l.films.slice(1).forEach((a,i)=>{dots+=`<circle class="fd" cx="${(i-(l.films.length-2)/2)*6}" cy="17.5" r="2.9" fill="${F[a.f].color}" stroke="#fff" stroke-width="1"/>`});
g.innerHTML=`<circle class="sel" cy="-3" r="22"/><circle cy="-3" r="18" fill="transparent"/><g class="pi"><ellipse class="disc" cy="11.6" rx="15.5" ry="3.6" fill="#3A2E28" opacity=".16"/><g class="ic" transform="scale(1.3)">${glyph(l.type,c,[...l.id].reduce((h,ch)=>(h*31+ch.charCodeAt(0))|0,7)>>>3)}</g>${dots}<g class="xm"><path d="M-9-11L9 7M9-11L-9 7" stroke="#C2382D" stroke-width="1.8" stroke-linecap="round"/></g><g class="bd bd-ch"><circle cx="12" cy="-13" r="5.4" fill="#E09A12" stroke="#fff" stroke-width="1.4"/><path d="M9.6-14.4h4.8M9.6-11.8h4.8" stroke="#fff" stroke-width="1.2"/></g><g class="bd bd-un"><circle cx="12" cy="-13" r="5.4" fill="#8A7B68" stroke="#fff" stroke-width="1.4"/><text x="12" y="-10.6" text-anchor="middle" class="bdq">?</text></g></g>`;
pinEl[l.id]=g;leadEl[l.id]=el('g',{class:'lead',style:'display:none'},leadG,`<path d="" fill="none" stroke="#2B3A4A" stroke-width="1" stroke-dasharray="3 2" opacity=".6" stroke-linecap="round"/><circle r="2.6" fill="${c}" stroke="#fff" stroke-width="1"/>`)});

let tw=null;
function layout(animate){const vis=visIds();const r=relax(S.layer,vis);POS=r.pos;TGT=r.tgt||{};
svg.classList.remove('L0','L1','L2');svg.classList.add('L'+S.layer);
cardsG.querySelectorAll('.pcard').forEach(c=>c.classList.toggle('on',r.cards.includes(c.dataset.c)&&L.some(l=>vis.has(l.id)&&(S.layer===0?l.screen.card:(l.shot&&l.shot.card))===c.dataset.c)));
const OC=new Set(r.oncard||[]);L.forEach(l=>{const g=pinEl[l.id];g.classList.toggle('oncard',OC.has(l.id));g.classList.toggle('off',!vis.has(l.id));leadEl[l.id].classList.toggle('off',!vis.has(l.id));g.classList.toggle('dim',!!S.focus&&!l.films.some(a=>a.f===S.focus))});
const from={};L.forEach(l=>from[l.id]=cur[l.id]||POS[l.id]);
cancelAnimationFrame(tw);
if(!animate){L.forEach(l=>{cur[l.id]=POS[l.id].slice();place(l.id)});return}
const t0=performance.now(),D=750;
(function step(t){const k=Math.min(1,(t-t0)/D),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
L.forEach(l=>{const a=from[l.id],b=POS[l.id];cur[l.id]=[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e];place(l.id)});
if(k<1)tw=requestAnimationFrame(step)})(t0);}
function place(id){const p=cur[id];pinEl[id].setAttribute('transform',`translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);const t=TGT[id],le=leadEl[id];if(!t){le.style.display='none';return}const dx=p[0]-t[0],dy=p[1]-3-t[1],d=Math.hypot(dx,dy);if(d<16){le.style.display='none';return}le.style.display='';const ex=t[0]+dx*(1-15/d),ey=t[1]+dy*(1-15/d);le.firstChild.setAttribute('d',`M${t[0].toFixed(1)} ${t[1].toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`);le.lastChild.setAttribute('cx',t[0].toFixed(1));le.lastChild.setAttribute('cy',t[1].toFixed(1))}

// ---------- viewport ----------
const vb={x:0,y:0,w:1100,h:1300};
function cw(){return svg.clientWidth||innerWidth}function ch(){return svg.clientHeight||innerHeight}
function region(){const W=cw(),H=ch(),mob=W<900;return{l:(S.panel&&!mob)?14+340+18:16,r:W-((S.card&&!mob)?14+372+18:16),t:mob?170:112,b:H-(mob?50:48)}}
function applyVB(){vb.h=vb.w*ch()/cw();svg.setAttribute('viewBox',`${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);hdDraw()}
function boxVB(x0,y0,x1,y1){const R=region(),s=Math.min((R.r-R.l)/(x1-x0),(R.b-R.t)/(y1-y0));const w=cw()/s;return{x:x0-(R.l+((R.r-R.l)-(x1-x0)*s)/2)/s,y:y0-(R.t+((R.b-R.t)-(y1-y0)*s)/2)/s,w}}
let vtw=null;
function goVB(t,dur=600){cancelAnimationFrame(vtw);const a={...vb},t0=performance.now();(function st(n){const k=Math.min(1,(n-t0)/dur),e=1-Math.pow(1-k,3);vb.x=a.x+(t.x-a.x)*e;vb.y=a.y+(t.y-a.y)*e;vb.w=a.w+(t.w-a.w)*e;applyVB();if(k<1)vtw=requestAnimationFrame(st)})(t0)}
const BOX={all:[-10,-10,1110,1310],shermer:[260,130,660,510],north:[200,60,860,640],downtown:[640,560,960,1070],west:[0,560,620,1120]};
function fit(name='all',anim=true){const b=BOX[name];const t=boxVB(...b);anim?goVB(t):(Object.assign(vb,t),applyVB())}
function toScreen(x,y){return[(x-vb.x)/vb.w*cw(),(y-vb.y)/vb.h*ch()]}
function ensureVisible(x,y){const R=region(),[sx,sy]=toScreen(x,y),m=70;if(sx>R.l+m&&sx<R.r-m&&sy>R.t+m&&sy<R.b-m)return;const s=cw()/vb.w;const w=Math.min(vb.w,700);const s2=cw()/w;goVB({w,x:x-((R.l+R.r)/2)/s2,y:y-((R.t+R.b)/2)/s2*(1)})}

// wheel / drag
svg.addEventListener('wheel',e=>{e.preventDefault();cancelAnimationFrame(vtw);const f=Math.exp(e.deltaY*(e.ctrlKey?.01:.0016));const nw=Math.max(160,Math.min(3200,vb.w*f));const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/cw(),py=(e.clientY-r.top)/ch();const wx=vb.x+px*vb.w,wy=vb.y+py*vb.h;vb.w=nw;vb.h=nw*ch()/cw();vb.x=wx-px*vb.w;vb.y=wy-py*vb.h;applyVB()},{passive:false});
let drag=null;
svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,vx:vb.x,vy:vb.y,moved:false,pin:e.target.closest('.pin')};try{svg.setPointerCapture(e.pointerId)}catch(_){}});
svg.addEventListener('pointermove',e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>4){drag.moved=true;svg.classList.add('panning');hideTip();cancelAnimationFrame(vtw)}if(drag.moved){vb.x=drag.vx-dx*vb.w/cw();vb.y=drag.vy-dy*vb.h/ch();applyVB()}return}
const pin=e.target.closest('.pin');pin?showTip(pin.dataset.id,e):hideTip()});
svg.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;svg.classList.remove('panning');if(!d.moved&&d.pin)selectLoc(d.pin.dataset.id)});
svg.addEventListener('pointerleave',hideTip);
svg.addEventListener('dblclick',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/cw(),py=(e.clientY-r.top)/ch();const wx=vb.x+px*vb.w,wy=vb.y+py*vb.h;const w=Math.max(160,vb.w*(e.shiftKey?2:.5)),h=w*ch()/cw();goVB({w,x:wx-px*w,y:wy-py*h},380)});
svg.addEventListener('keydown',e=>{const pin=e.target.closest&&e.target.closest('.pin');if(pin&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectLoc(pin.dataset.id)}});
document.querySelectorAll('.zc button').forEach(b=>b.onclick=()=>{const z=b.dataset.z;if(z==='fit')return fit('all');const f=z==='in'?.7:1.43;const cx=vb.x+vb.w/2,cy=vb.y+vb.h/2,w=Math.max(160,Math.min(3200,vb.w*f));goVB({w,x:cx-w/2,y:cy-(w*ch()/cw())/2},350)});

// ---------- tooltip ----------
const tip=$('#tip');
function showTip(id,e){const l=LI[id];const fl=l.films.map(a=>`<span><i style="background:${F[a.f].color}"></i>${esc(F[a.f].title)}</span>`).join('');
const line=S.layer===0?esc(l.screen.as):S.layer===1?esc(l.addr)+(l.place?' · '+esc(P[l.place].name):''):`<b class="ts ts-${l.now.s}">${STATUS[l.now.s]}</b>`;
tip.innerHTML=`<b>${esc(S.layer===0&&l.screen.world==='shermer'?l.screen.as:l.name)}</b><div class="tm">${line}</div><div class="tf">${fl}</div>`;tip.classList.add('on');
const x=Math.min(e.clientX+16,innerWidth-300),y=Math.min(e.clientY+14,innerHeight-120);tip.style.left=x+'px';tip.style.top=y+'px'}
function hideTip(){tip.classList.remove('on')}

// ---------- mascot ----------
const HOME=HMap.HOME;const HD={x:HOME[0],y:HOME[1],dir:1,anim:null};
function hdScale(){const ppu=cw()/vb.w;return Math.max(.22,Math.min(1.1,62/(92*ppu)))}
function hdDraw(){const s=hdScale();hd.setAttribute('transform',`translate(${HD.x.toFixed(1)},${HD.y.toFixed(1)}) scale(${(HD.dir*s).toFixed(3)},${s.toFixed(3)}) translate(-30,-92)`)}
function walkTo(x,y,cb){cancelAnimationFrame(HD.anim);const home=Math.hypot(x-HOME[0],y-HOME[1])<2;if(!home)svg.classList.add('away');const done=cb;cb=()=>{if(home)svg.classList.remove('away');done&&done()};const a=[HD.x,HD.y],d=Math.hypot(x-a[0],y-a[1]);if(d<2){cb&&cb();return}HD.dir=x<a[0]?-1:1;hd.classList.add('walking');const dur=Math.max(450,Math.min(2200,d*3.2)),t0=performance.now();
(function st(n){const k=Math.min(1,(n-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;HD.x=a[0]+(x-a[0])*e;HD.y=a[1]+(y-a[1])*e;hdDraw();if(k<1)HD.anim=requestAnimationFrame(st);else{hd.classList.remove('walking');cb&&cb()}})(t0)}
function hdBeside(id){const p=POS[id];if(!p)return;const s=hdScale();walkTo(p[0]-(16+22*s),p[1]+12)}

// ---------- panel ----------
const LAYERS=[{k:'On screen',d:'Places as the films present them. Shermer’s locations gather into one fictional town; Chicago buildings that stood in for New York and St. Louis move to their story cities.'},
{k:'Where shot',d:'Filming locations as listed in the source.'},
{k:'There now',d:'The same places today. Demolished sites are drawn as outlines; changed sites are marked; anything not yet confirmed says so.'}];
const rng=$('#layer');
function setLayer(n,opts={}){if(opts.init){S.layer=n;rng.value=n;document.querySelectorAll('.lstop').forEach((b,i)=>b.classList.toggle('on',i===n));{const ld=$('#ldesc');if(ld)ld.textContent=LAYERS[n].d}{const ln=$('#lname');if(ln)ln.textContent=LAYERS[n].k}renderKey();return}S.layer=n;localStorage.setItem('hughes.layer',n);rng.value=n;document.querySelectorAll('.lstop').forEach((b,i)=>b.classList.toggle('on',i===n));{const ld=$('#ldesc');if(ld)ld.textContent=LAYERS[n].d}{const ln=$('#lname');if(ln)ln.textContent=LAYERS[n].k}renderKey();layout(true);if(S.sel)setTimeout(()=>hdBeside(S.sel),opts.quick?0:60);if(S.card)renderCard()}
rng.addEventListener('input',()=>setLayer(+rng.value));
document.querySelectorAll('.lstop').forEach((b,i)=>b.onclick=()=>setLayer(i));

const cnt=f=>L.filter(l=>l.films.some(a=>a.f===f)).length;
function renderFilms(){$('#films').innerHTML=data.films.map(f=>`<div class="fl${S.films.has(f.id)?'':' off'}${S.focus===f.id?' foc':''}"><button class="fsw" role="switch" data-t="${f.id}" aria-checked="${S.films.has(f.id)}" aria-label="Show ${esc(f.title)} locations" style="--c:${f.color}"></button><button class="fname" data-t="${f.id}" title="${esc(f.title)} — show or hide on the map"><span>${esc(SHORT_TITLE[f.title]||f.title)}</span><small>${f.year} · ${cnt(f.id)}</small></button><button class="finfo" data-o="${f.id}" aria-label="${esc(f.title)} details" title="Film details">i</button></div>`).join('');
$('#films').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const id=b.dataset.t;S.films.has(id)?S.films.delete(id):S.films.add(id);renderFilms();layout(true)});
$('#films').querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>openFilm(b.dataset.o))}
$('#fall').onclick=()=>{data.films.forEach(f=>S.films.add(f.id));renderFilms();layout(true)};
$('#fnone').onclick=()=>{S.films.clear();renderFilms();layout(true)};

function renderKey(){const k=$('#key');const c={};L.forEach(l=>c[l.now.s]=(c[l.now.s]||0)+1);
const sw=(cls,label,n)=>`<div class="ki"><i class="${cls}"></i><span>${label}</span>${n!=null?`<small>${n}</small>`:''}</div>`;
let h='';
if(S.layer===0)h=sw('k-sh','Shermer — a fictional composite')+sw('k-pc','Postcard — story set elsewhere');
else if(S.layer===1)h=sw('k-pc','Postcard — filmed outside Illinois')+sw('k-edge','Dashed tag — off scale');
else h=sw('k-ok','Standing',(c.standing||0)+(c.private||0))+sw('k-ch','Changed or repurposed',c.changed||0)+sw('k-de','Demolished',c.demolished||0)+sw('k-un','Not yet confirmed',c.unknown||0);
h+=sw('k-multi','Dots beneath — in several films');
k.innerHTML=h}

document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='shermer'&&S.layer!==0)setLayer(0);fit(g)});

// find
const q=$('#q'),qr=$('#qr');
q.addEventListener('input',()=>{const s=q.value.trim().toLowerCase();if(!s){qr.hidden=true;return}
const hits=L.filter(l=>[l.name,l.addr,l.screen.as,l.place&&P[l.place].name,...l.films.map(a=>F[a.f].title)].join(' ').toLowerCase().includes(s)).slice(0,8);
qr.innerHTML=hits.length?hits.map(l=>`<button data-id="${l.id}"><b>${esc(l.name)}</b><small>${esc(l.place?P[l.place].name:'Off the map')}</small></button>`).join(''):'<p class="fine">No match in this guide.</p>';qr.hidden=false;
qr.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectLoc(b.dataset.id);qr.hidden=true;q.value=''})});
q.addEventListener('keydown',e=>{if(e.key==='Enter'){const b=qr.querySelector('button');b&&b.click()}if(e.key==='Escape'){qr.hidden=true;q.blur()}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==q){e.preventDefault();q.focus()}if(e.key==='Escape'&&!$('#notes').open){if(S.tour)endTour();else closeCard()}});

// ---------- cards ----------
const card=$('#card');
function filmChips(l){return l.films.map(a=>`<button class="fc" data-o="${a.f}" style="--c:${F[a.f].color}">${esc(F[a.f].title)} <small>${F[a.f].year}</small></button>`).join('')}
function flagsHTML(l){const fl=l.flags||[];const m={private:'Private residence',disputed:'Disputed',doubling:'Doubling for another city',annotated:'Annotated · not plotted in Illinois'};return fl.map(f=>`<span class="flag f-${f}">${m[f]}</span>`).join('')+'<span class="flag f-ver">Verified: not yet</span>'}
function nowSlot(l){const m=MI[l.id]&&MI[l.id].now;if(!m)return '';return `<figure class="shot one"><a href="${esc(m.page)}" target="_blank" rel="noopener"><img src="${esc(m.thumb)}" alt="${esc(m.title)}" loading="lazy"></a><figcaption><span>${m.match==='town'?'The area':'Now'}</span> ${m.match==='town'?esc(m.place)+(m.private?' (private home not pictured)':'')+' · ':''}${esc(m.artist||'Author unknown')} · <a href="${esc(m.licenseUrl||m.page)}" target="_blank" rel="noopener">${esc(m.license)}</a> · Wikimedia Commons${m.match==='name'?' · <i>match unverified</i>':''}</figcaption></figure>`}
function renderLoc(l){const pl=l.place?P[l.place]:null;
const shot=l.shot&&l.shot.card?`<b>${esc(C[l.shot.card].name)}, ${esc(C[l.shot.card].sub)}</b><br>${esc(l.addr)}. Annotated here rather than plotted as a Chicago-area location.`:`<b>${esc(l.addr)}</b>${pl&&!l.addr.includes(pl.name)?', '+esc(pl.name):''}${pl&&pl.edge?' <span class="mut">(off scale on this map)</span>':''}<ul>${l.films.map(a=>`<li><i style="background:${F[a.f].color}"></i>${esc(F[a.f].title)} — ${esc(a.scene)}</li>`).join('')}</ul>`;
const scr=`<b>${esc(l.screen.as)}</b>${l.screen.world==='elsewhere'?` <span class="mut">— Chicago-area footage presented as ${esc(C[l.screen.card].name)}</span>`:l.screen.world==='shermer'?' <span class="mut">— fictional Shermer, Illinois</span>':''}`;
const now=`<b class="ts ts-${l.now.s}">${STATUS[l.now.s]}</b> ${esc(l.now.note)} <span class="basis b-${l.now.basis}">${l.now.basis==='dataset'?'Source':'Editorial · verify'}</span>`;
const rows=[['On screen',scr],['Where it was shot',shot],['What’s there now',now]].map((r,i)=>`<div class="lr${i===S.layer?' on':''}"><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
const prec={landmark:'Plotted at the landmark (schematic map).',street:'Plotted near the street address (schematic map).',town:'Plotted at town level (schematic map).'};
const more=L.filter(o=>o.id!==l.id&&o.films.some(a=>a.f===l.films[0].f)).slice(0,10);
card.innerHTML=`<div class="grip" title="Drag to move" aria-hidden="true"></div><button class="x" aria-label="Close">×</button>
<div class="chips2">${filmChips(l)}</div>
<h2 class="ct">${esc(l.name)}</h2>
<div class="flags">${flagsHTML(l)}</div>
<dl class="lrs">${rows}</dl>
${l.myth?`<div class="myth"><div class="k">On the record</div><p>${esc(l.myth)}</p></div>`:''}
${nowSlot(l)}
<p class="fine">${(l.flags||[]).includes('private')?'Private home. Shown at town level on the map; please view from the public way only. ':''}${l.geo?prec[l.geo[2]]:'Not plotted geographically.'} Source: compiled location list, v1 — not yet checked against production records or location permits.</p>
${more.length?`<div class="k">More from ${esc(F[l.films[0].f].title)}</div><div class="more">${more.map(o=>`<button data-id="${o.id}">${esc(o.name)}</button>`).join('')}</div>`:''}`;
wireCard()}
function renderFilm(f){const locs=L.filter(l=>l.films.some(a=>a.f===f.id));const groups={};locs.forEach(l=>{const k=l.place?P[l.place].name:'Off the map';(groups[k]=groups[k]||[]).push(l)});
card.innerHTML=`<div class="grip" title="Drag to move" aria-hidden="true"></div><button class="x" aria-label="Close">×</button>
<div class="fhead"><div class="fht"><div class="kick" style="color:${f.color}">${f.year}</div><div class="fby">John Hughes, ${esc(f.role)}${f.dir?' · Directed by '+esc(f.dir):''}</div>
<h2 class="ct">${esc(f.title)}</h2></div>${MF[f.id]?`<figure class="poster"><a href="${esc(MF[f.id].page)}" target="_blank" rel="noopener"><img src="${esc(MF[f.id].poster)}" alt="${esc(f.title)} poster"></a><figcaption>Poster © studio · via Wikipedia</figcaption></figure>`:''}</div>
<dl class="lrs"><div class="lr"><dt>Story geography</dt><dd><b>${esc(f.story)}</b></dd></div><div class="lr"><dt>On the map</dt><dd>${esc(f.sig)}</dd></div></dl>
${f.note?`<p>${esc(f.note)}</p>`:''}
<div class="k">${locs.length} places</div>
<div class="grp">${Object.entries(groups).map(([k,ls])=>`<div><div class="gk">${esc(k)}</div><div class="more">${ls.map(o=>`<button data-id="${o.id}" style="--c:${f.color}">${esc(o.name)}</button>`).join('')}</div></div>`).join('')}</div>
${f.id==='fb'?'<button class="btn" id="ctour">Guided tour · Ferris’s day off</button>':''}
<p class="fine">Source: compiled location list, v1.</p>`;
wireCard();const t=$('#ctour');if(t)t.onclick=startTour}
// drag the card by its grip or any non-interactive area
const CD={x:0,y:0};function setCD(){card.style.setProperty('--dx',CD.x+'px');card.style.setProperty('--dy',CD.y+'px')}
card.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a,input,.more,.chips2'))return;if(!e.target.closest('.grip,.ct,.card>.kick,.flags'))return;const r=card.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,ox=CD.x,oy=CD.y;let moved=false;
const mv=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(!moved&&Math.hypot(dx,dy)<4)return;if(!moved){moved=true;card.classList.add('dragging');getSelection().removeAllRanges()}ev.preventDefault();CD.x=Math.max(ox-r.left+8,Math.min(ox+innerWidth-r.right-8,ox+dx));CD.y=Math.max(oy-r.top+8,Math.min(oy+innerHeight-r.top-60,oy+dy));setCD()};
const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);card.classList.remove('dragging')};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
addEventListener('resize',()=>{if(!CD.x&&!CD.y)return;const r=card.getBoundingClientRect();if(r.right>innerWidth-8)CD.x-=r.right-innerWidth+8;if(r.left<8)CD.x+=8-r.left;if(r.top<8)CD.y+=8-r.top;if(r.top>innerHeight-60)CD.y-=r.top-innerHeight+60;setCD()});
function wireCard(){card.querySelector('.x').onclick=closeCard;card.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>selectLoc(b.dataset.id));card.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>openFilm(b.dataset.o));card.scrollTop=0}
function renderCard(){if(!S.card)return;S.card.t==='loc'?renderLoc(LI[S.card.id]):renderFilm(F[S.card.id])}
function openCard(){card.classList.add('open');app.classList.add('cardopen')}
function closeCard(){S.card=null;S.sel=null;card.classList.remove('open');app.classList.remove('cardopen');L.forEach(l=>pinEl[l.id].classList.remove('on'));if(S.focus){S.focus=null;layout(false);renderFilms()}walkTo(HOME[0],HOME[1])}
function selectLoc(id,o={}){const l=LI[id];if(!l.films.some(a=>S.films.has(a.f))){S.films.add(l.films[0].f);renderFilms();layout(false)}
if(S.focus&&!l.films.some(a=>a.f===S.focus)&&!S.tour){S.focus=null;layout(false);renderFilms()}
S.sel=id;S.card={t:'loc',id};L.forEach(x=>pinEl[x.id].classList.toggle('on',x.id===id));pinsG.appendChild(pinEl[id]);renderLoc(l);openCard();const p=POS[id];ensureVisible(p[0],p[1]);hdBeside(id)}
function openFilm(fid){S.focus=fid;S.films.add(fid);S.sel=null;S.card={t:'film',id:fid};L.forEach(x=>pinEl[x.id].classList.remove('on'));renderFilms();layout(true);renderFilm(F[fid]);openCard()}

// ---------- tour ----------
const tb=$('#tb');
function startTour(){S.tour={i:0};if(S.layer!==1)setLayer(1,{quick:true});S.focus='fb';S.films.add('fb');renderFilms();layout(true);tb.hidden=false;fit('all');setTimeout(()=>tourGo(0),400)}
function tourGo(i){const st=data.tour.steps;S.tour.i=i;const s=st[i];
$('#tbn').textContent=`${i+1} / ${st.length}`;$('#tbt').textContent=s.text;$('#tbp').disabled=i===0;$('#tbx').textContent=i===st.length-1?'Finish':'Next stop';
routeG.innerHTML='';const pts=st.slice(0,i+1).map(x=>POS[x.id]);if(pts.length>1)el('path',{d:'M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L'),fill:'none',stroke:F.fb.color,'stroke-width':2.6,'stroke-dasharray':'2 6','stroke-linecap':'round'},routeG);
selectLoc(s.id,{tour:true})}
function endTour(){S.tour=null;tb.hidden=true;routeG.innerHTML='';S.focus=null;renderFilms();layout(true)}
$('#tbp').onclick=()=>tourGo(Math.max(0,S.tour.i-1));
$('#tbx').onclick=()=>{if(S.tour.i>=data.tour.steps.length-1)return endTour();tourGo(S.tour.i+1)};
$('#tbe').onclick=endTour;
$('#tourBtn').onclick=startTour;

// panel toggle / notes
$('#ptog').onclick=()=>{S.panel=!S.panel;app.classList.toggle('nopanel',!S.panel);$('#ptog').textContent=S.panel?'Hide Nav Panels':'Show Nav Panels'};
$('#notesBtn').onclick=()=>$('#notes').showModal();$('#notesX').onclick=()=>$('#notes').close();
$('#span').textContent=`${data.films.length} films · 1984–1997 · ${L.length} places`;

// init
const avoid=[];[0,1].forEach(ly=>{const {T}=rawTargets(ly);Object.values(T).forEach(t=>avoid.push([t[0],t[1]]))});Object.values(base).forEach(b=>avoid.push(b));
window.HData=data;HMap.animate(M.movers||[]);renderFilms();setLayer(S.layer,{init:true});layout(false);fit('all',false);hdDraw();
// Always open with every film on in the Fit view; re-fit once fonts and layout have settled.
{const refit=()=>{if(!S.sel&&!S.tour)fit('all',false)};document.fonts?.ready.then(refit);addEventListener('load',refit,{once:true})}
(window.requestIdleCallback||(f=>setTimeout(f,60)))(()=>{HMap.decorate(M.world,M.rects,M.samples,avoid,M.VW,M.VH);[0,1,2].forEach(ly=>{if(ly!==S.layer)relax(ly,visIds())})});
addEventListener('resize',()=>applyVB());
})();
