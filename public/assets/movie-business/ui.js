/* UI — state, mode panels, movie card, search, timeline. */
const $=id=>document.getElementById(id);
const S={mode:'explore',x:'year',y:'intl',color:'genre',size:'budget',split:'genre',bench:'budget',tmetric:'budget',yr:[2001,2025],yrPrev:null,
 hide:{genre:new Set(),studio:new Set(),era:new Set(),mpa:new Set()},
 layers:{trend:true,labels:false,outl:false,context:true,ghosts:true},sel:null,nb:null,focus:null,panel:innerWidth>=1100,relT:.25,
 nbDims:new Set(['budget','genre','tomato','popcorn','ww']),stat:null,bstat:null,playing:null,people:[]};
const AXES=['budget','open','dom','intl','ww','tomato','popcorn','imdb','runtime','oscars','reviews','intlShare','gap','ratio','legs','year'];
const SIZES={budget:'Production Budget',ww:'Worldwide Gross',open:'Opening Weekend',reviews:'RT Critic Reviews',none:'Same size'};
const percent=v=>isFinite(v)?Math.round(v)+'%':'—';
const TMET={budget:['Median production budget',l=>median(l.map(f=>f.budget)),fmtM],
 intlShare:['Median international share',l=>median(l.map(f=>f.intlShare)),percent],open:['Median opening weekend',l=>median(l.map(f=>f.open)),fmtM],
 ww:['Median worldwide gross',l=>median(l.map(f=>f.ww)),fmtM],tomato:['Median Tomatometer',l=>median(l.map(f=>f.tomato)),percent],
 popcorn:['Median Popcornmeter',l=>median(l.map(f=>f.popcorn)),percent],gap:['Median audience − critic gap',l=>median(l.map(f=>f.gap)),v=>isFinite(v)?sgn(Math.round(v))+' pts':'—']};
const NBD={budget:'Budget',genre:'Genre',tomato:'Critic score',popcorn:'Audience score',ww:'Box office'};
const app=$('app'),side=$('mp'),card=$('card');
const opts=(keys,sel,lab)=>keys.map(k=>`<option value="${k}"${k===sel?' selected':''}>${lab(k)}</option>`).join('');
const axisSel=(k,v)=>`<select data-k="${k}" aria-label="${k}">${opts(AXES,v,a=>VARS[a].label)}</select>`;
const colSel=(k,v)=>`<select data-k="${k}">${opts(Object.keys(COLORBY),v,a=>COLORBY[a].label)}</select>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nameOf=f=>f.title||('Record '+f.rec);

function commit(){retarget();if(S.mode==='rel')buildRel();renderPanel();renderTL();renderCard();syncChrome()}
function syncChrome(){app.classList.toggle('nopanel',!S.panel);app.classList.toggle('cardopen',(!!S.sel||S.people.length>0)&&S.mode!=='rel');relSvg.classList.toggle('on',S.mode==='rel');
 document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));$('zc').hidden=!isScatter();$('ptog').textContent=S.panel?'Hide panel':'Panel';$('clearf').hidden=!S.focus&&!S.people.length}
function setMode(m){if(m===S.mode)return;if(S.mode==='time'){stopPlay();if(S.yrPrev){S.yr=S.yrPrev;S.yrPrev=null}}
 if(m==='time'&&S.yr[0]===2001&&S.yr[1]===2025){S.yrPrev=S.yr.slice();S.yr=[2001,2005]}
 if(!['explore','time'].includes(m))resetZoom();if(m==='rel'){S.sel=null;S.nb=null;S.focus=null;S.people=[]}S.mode=m;hideTip();commit()}

/* ---------- mode panels ---------- */
function legendHTML(dim,title){const D=COLORBY[dim],cnt={};for(const f of FILMS)if(f.win&&passes(f,dim)){const c=catOf(dim,f);cnt[c]=(cnt[c]||0)+1}
 return `<div class="sec"><div class="k row">${title||D.label}${S.hide[dim].size?`<button class="linkb" data-showall="${dim}">Show all</button>`:'<span class="kh">Click to hide</span>'}</div><div class="lg">${D.cats.map((c,i)=>`<button class="lgi${S.hide[dim].has(c)?' off':''}" data-hide="${dim}|${esc(c)}"><i style="background:${D.colors[i]}"></i><span>${c}</span><small>${cnt[c]||0}</small></button>`).join('')}</div></div>`}
function sizeLegend(){if(S.size==='none')return '';const mx=SZMAX[S.size],V=VARS[S.size],vals=[mx*.04,mx*.25,mx].map(v=>{const e=10**Math.floor(Math.log10(v));return Math.round(v/e)*e});
 return `<div class="szl"><span class="k">${SIZES[S.size]}</span><div class="szr">${vals.map(v=>{const r=1.4+10*Math.sqrt(v/mx);return `<span><svg width="${2*r+2}" height="${2*r+2}"><circle cx="${r+1}" cy="${r+1}" r="${r}" fill="none" stroke="#BFB5A4"/></svg>${V.fmt(v)}</span>`}).join('')}</div></div>`}
function connHTML(){const st=S.stat,X=VARS[S.x],Y=VARS[S.y];if(!st)return `<div class="sec"><p class="fine">Not enough films in view to measure a relationship.</p></div>`;
 const r=st.r,a=Math.abs(r),dir=r>0?'higher':'lower';
 const say=a<.1?`${X.label} and ${Y.label.toLowerCase()} show no clear straight-line pattern in this view.`:S.x==='year'?`Later films tend to have ${dir} ${Y.noun} in this view.`:`Films with higher ${X.noun} tend to have ${dir} ${Y.noun} in this view.`;
 const bias=REVENUE.has(S.x)||REVENUE.has(S.y)?`<p class="fine">Films were selected from high-domestic-gross samples. That selection can tilt relationships involving box office.</p>`:'';
 return `<div class="sec"><div class="k">How strongly are these connected?</div>
<div class="rrow"><div class="rbar"><b style="left:50%"></b><i style="left:${(r+1)*50}%"></i></div><span class="rval">r = ${fmtR(r)}</span></div>
<div class="rsc"><span>−1 opposite</span><span>0 none</span><span>+1 together</span></div>
<div class="rword">${strength(r)} relationship</div><p>${say}</p>
<p class="caveat">This does not mean ${X.label.toLowerCase()} caused ${Y.label.toLowerCase()}.</p>${bias}
<details class="why"><summary>What is r? · ${st.n.toLocaleString()} films</summary><p class="fine">Pearson’s r measures how closely two measures rise and fall together along a straight line — from −1 (they move in opposite directions) through 0 (no straight-line pattern) to +1 (they move together perfectly). Dollar figures and counts are compared on a log scale, so r describes proportional relationships.</p></details></div>`}
function layersHTML(){const L=[['trend','Trend line'],['labels','Film labels'],['outl','Outlier rings'],['context','Context periods'],['ghosts','Time ghosts']];
 return `<details class="sec"${S.mode==='explore'?' open':''}><summary class="k">Map layers</summary><div class="tgs">${L.map(([k,l])=>`<label class="tg"><span>${l}</span><input type="checkbox" data-layer="${k}"${S.layers[k]?' checked':''}><i class="sw"></i></label>`).join('')}</div>
<p class="fine">Context periods mark industry-wide events for orientation. They are annotations, not explanations of any film’s results.</p></details>`}
function filtersHTML(){const dims=['genre','studio','mpa'].filter(d=>d!==S.color||S.mode!=='explore');const act=Object.values(S.hide).reduce((s,h)=>s+h.size,0);
 return `<details class="sec"><summary class="k">Filters${act?` · ${act} hidden`:''}</summary>${dims.map(d=>`<div class="fg"><div class="fgl">${COLORBY[d].label}</div><div class="chips">${COLORBY[d].cats.map(c=>`<button class="chip${S.hide[d].has(c)?' off':''}" data-hide="${d}|${esc(c)}">${c}</button>`).join('')}</div></div>`).join('')}${act?'<button class="linkb" data-clearall="1">Clear all filters</button>':''}</details>`}

function renderPanel(){let h='';const m=S.mode;
 if(m==='explore')h=`<div class="sec"><div class="k">Ask the field</div>
<label class="sb"><span>Compare</span>${axisSel('x',S.x)}</label><label class="sb"><span>With</span>${axisSel('y',S.y)}</label>
<div class="sb2"><label class="sb sm"><span>Color by</span>${colSel('color',S.color)}</label><label class="sb sm"><span>Size by</span><select data-k="size">${opts(Object.keys(SIZES),S.size,k=>SIZES[k])}</select></label></div>
<div class="brow"><button class="btn alt sm" data-swap="1">Swap axes</button><button class="btn alt sm" data-rand="1">Try a question</button></div></div>
${connHTML()}${legendHTML(S.color)}<div class="sec">${sizeLegend()}</div>${filtersHTML()}${layersHTML()}`;
 else if(m==='rel'){const top=REL.slice(0,10);h=`<div class="sec"><h2 class="h2">The Relationship Map</h2><p>Eleven measures of a film’s money, reception and recognition. Each line joins two measures; the thicker and brighter it is, the more closely they rise and fall together. Each pair uses films with both values recorded.</p>
<div class="rkey"><span><i style="background:#E8A83E"></i>Move together</span><span><i style="background:#6FA8DC"></i>Move in opposite directions</span></div></div>
<div class="sec"><div class="k row">Show connections stronger than<b class="am">|r| ≥ ${S.relT.toFixed(2)}</b></div><input type="range" min="0" max="0.8" step="0.05" value="${S.relT}" data-relt="1" class="rng2"></div>
<div class="sec"><div class="k">Strongest connections</div><div class="plist">${top.map(p=>`<button data-pair="${p.a}|${p.b}"><span>${SHORT[p.a]} <em>↔</em> ${SHORT[p.b]}</span><i class="pb"><b style="width:${Math.abs(p.r)*100}%;background:${p.r>0?'#E8A83E':'#6FA8DC'}"></b></i><small>${fmtR(p.r)}</small></button>`).join('')}</div>
<p class="fine">Select a pair to see every film behind the number. Strong connections between grosses are partly built in — worldwide includes domestic.</p></div>${filtersHTML()}`}
 else if(m==='outliers'){const over=OUTR.slice(0,5),under=OUTR.slice(-5).reverse(),row=f=>`<button data-pick="${f.id}"><span>${esc(nameOf(f))}</span><small>${f.year}</small><b class="${f.l2>=0?'up':'dn'}">${f.l2>=0?'+':'−'}${Math.abs(Math.round((2**f.l2-1)*100))}%</b></button>`;
  h=`<div class="sec"><h2 class="h2">Against Expectations</h2><p>Which movies broke the pattern? Each dot is a film, stacked in its release year. Height shows how its worldwide box office compares with what the trend predicts for films with similar…</p>
<label class="sb"><span>Similar</span><select data-k="bench">${opts(Object.keys(BENCH),S.bench,k=>({budget:'Production Budget',open:'Opening Weekend',genre:'Genre'})[k])}</select></label>
<div class="dvl"><div class="dvb"></div><div class="dvs"><span>−75%</span><span>As expected</span><span>+300%</span></div></div></div>
<div class="sec"><div class="k">Outperformed most</div><div class="olist">${over.map(row).join('')}</div><div class="k">Underperformed most</div><div class="olist">${under.map(row).join('')}</div></div>
<div class="sec"><p class="fine">“Expected” is a fitted trend (least squares on log dollars) within the films in view. Beating the trend is not the same as turning a profit — box office is ticket sales, shared with exhibitors, before many other costs and revenue streams.</p></div>${filtersHTML()}${layersHTML()}`}
 else if(m==='compare'){const ps=PANELS.slice().sort((a,b)=>(b.st?b.st.r:-2)-(a.st?a.st.r:-2));
  h=`<div class="sec"><h2 class="h2">Break It Apart</h2><p>Does the relationship hold equally across different kinds of movies? The field splits into one panel per group, each with its own trend and r.</p>
<label class="sb"><span>Compare</span>${axisSel('x',S.x)}</label><label class="sb"><span>With</span>${axisSel('y',S.y)}</label><label class="sb"><span>Break down by</span>${colSel('split',S.split)}</label></div>
<div class="sec"><div class="k">Strength by group</div><div class="plist">${ps.map(p=>`<button data-iso="${esc(p.c)}"><span><i class="dot" style="background:${p.col}"></i>${p.c}</span><i class="pb"><b style="width:${p.st?Math.abs(p.st.r)*100:0}%;background:${p.st&&p.st.r<0?'#6FA8DC':'#E8A83E'}"></b></i><small>${p.st?fmtR(p.st.r):'—'}</small></button>`).join('')}</div>
<p class="fine">Groups with fewer than 3 films in view are left out. Small groups produce unstable r values — read them as hints.</p></div>${filtersHTML()}`}
 else if(m==='time'){const inW=FILMS.filter(f=>f.ok&&f.win),base=FILMS.filter(f=>f.ok&&f.year<=2005),all=FILMS.filter(f=>f.ok);
  h=`<div class="sec"><h2 class="h2">Time Machine</h2><p>Has the movie business changed? Drag or play the window along the timeline and watch films enter, leave and reposition. Faint dots are the films outside the window.</p>
<div class="brow"><button class="btn" data-play="1">${S.playing?'Pause':'Play the years'}</button><button class="btn alt" data-win="5">5-year window</button><button class="btn alt" data-win="1">Single year</button></div>
<label class="sb"><span>Compare</span>${axisSel('x',S.x)}</label><label class="sb"><span>With</span>${axisSel('y',S.y)}</label>
<label class="sb"><span>Timeline shows</span><select data-k="tmetric">${opts(Object.keys(TMET),S.tmetric,k=>TMET[k][0])}</select></label></div>
<div class="sec"><div class="k">This window vs. 2001–05</div><table class="wt"><thead><tr><th></th><th>${S.yr[0]===S.yr[1]?S.yr[0]:S.yr[0]+'–'+String(S.yr[1]).slice(2)}</th><th>2001–05</th></tr></thead><tbody>
${['budget','intlShare','open','tomato','popcorn'].map(k=>`<tr><td>${TMET[k][0]}</td><td>${TMET[k][2](TMET[k][1](inW))}</td><td>${TMET[k][2](TMET[k][1](base))}</td></tr>`).join('')}
<tr><td>Films in view</td><td>${inW.length}</td><td>${base.length}</td></tr><tr><td>r in this view</td><td>${S.stat?fmtR(S.stat.r):'—'}</td><td>${(()=>{const s=corr(base,VARS[S.x],VARS[S.y]);return s?fmtR(s.r):'—'})()}</td></tr></tbody></table>
<p class="fine">Dollar figures are nominal. RT scores are unavailable for many films, especially 2025; medians use the films with recorded values.</p></div>${legendHTML(S.color)}${layersHTML()}`}
 side.innerHTML=h}

side.addEventListener('change',e=>{const t=e.target;if(t.dataset.k){S[t.dataset.k]=t.value;if(t.dataset.k==='x'||t.dataset.k==='y')resetZoom();commit()}else if(t.dataset.layer){S.layers[t.dataset.layer]=t.checked;commit()}});
side.addEventListener('input',e=>{if(e.target.dataset.relt){S.relT=+e.target.value;e.target.previousElementSibling.querySelector('b').textContent='|r| ≥ '+S.relT.toFixed(2);buildRel()}});
side.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.hide){const [k,c]=d.hide.split('|');const h=S.hide[k];h.has(c)?h.delete(c):h.add(c);if(h.size===COLORBY[k].cats.length)h.clear();commit()}
 else if(d.showall){S.hide[d.showall].clear();commit()}else if(d.clearall){for(const k in S.hide)S.hide[k].clear();commit()}
 else if(d.swap){[S.x,S.y]=[S.y,S.x];resetZoom();commit()}
 else if(d.rand){const Q=[['tomato','popcorn'],['budget','intl'],['open','dom'],['budget','tomato'],['year','budget'],['year','intlShare'],['tomato','oscars'],['open','legs'],['year','gap']];const cur=Q.findIndex(q=>q[0]===S.x&&q[1]===S.y);[S.x,S.y]=Q[(cur+1)%Q.length];resetZoom();commit()}
 else if(d.pair){openPair(...d.pair.split('|'))}else if(d.pick!==undefined){selectFilm(FILMS[+d.pick])}else if(d.iso){isolateGroup(S.split,d.iso)}
 else if(d.play){S.playing?stopPlay():startPlay()}else if(d.win){const w=+d.win-1,a=Math.min(S.yr[0],2025-w);S.yr=[a,a+w];commit()}});

function openPair(a,b){S.x=a;S.y=b;resetZoom();setMode('explore');commit()}
function isolateGroup(dim,c){const h=S.hide[dim];h.clear();COLORBY[dim].cats.forEach(x=>{if(x!==c)h.add(x)});S.color=dim==='era'?'genre':S.color;setMode('explore');commit()}

/* ---------- movie card ---------- */
function neighbors(f){const num={budget:x=>x.budget>0?Math.log10(x.budget):NaN,tomato:x=>x.tomato,popcorn:x=>x.popcorn,ww:x=>x.ww>0?Math.log10(x.ww):NaN};
 const sd={};for(const k in num){const v=FILMS.map(num[k]).filter(x=>x!=null&&isFinite(x)),m=v.reduce((s,x)=>s+x,0)/(v.length||1);sd[k]=Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(v.length||1))||1}
 const dims=[...S.nbDims];return FILMS.filter(o=>o!==f&&o.ok&&o.win).map(o=>{let d=0,used=0;for(const k of dims){if(num[k]){const a=num[k](o),b=num[k](f);if(a!=null&&b!=null&&isFinite(a)&&isFinite(b)){d+=((a-b)/sd[k])**2;used++}}else{d+=o[k]===f[k]?0:1.6;used++}}return [used?d/used:Infinity,o]}).filter(p=>isFinite(p[0])).sort((a,b)=>a[0]-b[0]).slice(0,10).map(p=>p[1])}
function whyText(f){const X=VARS[S.x],Y=VARS[S.y],nm=esc(f.title||'This record');
 if(f.streaming&&(X.rev||Y.rev||S.mode==='outliers'))return `${nm} was released mainly on ${esc(f.streaming)}. Its box office covers only a limited cinema run, so it is drawn as a ring and left out of the trend and outlier calculations.`;
 if(S.mode==='outliers'&&isFinite(f.l2)){const p=Math.round((2**f.l2-1)*100);return `${nm} earned ${Math.abs(p)<8?'about what the trend predicts':Math.abs(p)+'% '+(p>0?'more':'less')+' at the worldwide box office than the trend predicts'} for films with ${S.bench==='genre'?'the same primary genre ('+f.genre+')':'a comparable '+BENCH[S.bench]} in this view.`}
 const st=S.stat;if(!st||!isFinite(tv(X,f))||!isFinite(tv(Y,f)))return '';const res=tv(Y,f)-(st.a+st.b*tv(X,f));
 let s;if(Y.log){const p=Math.round((10**res-1)*100);s=Math.abs(p)<8?`${nm} sits close to the trend — its ${Y.label.toLowerCase()} is about what films with a comparable ${X.label.toLowerCase()} show in this view.`:`${nm} sits ${Math.abs(p).toLocaleString()}% ${p>0?'above':'below'} the ${Y.label.toLowerCase()} the trend predicts for films with a comparable ${X.label.toLowerCase()}.`}
 else{const d=Math.round(res*10)/10;s=`${nm} sits ${Math.abs(d)} ${S.y==='tomato'||S.y==='popcorn'||S.y==='gap'?'points':'units'} ${d>0?'above':'below'} the ${Y.label} the trend predicts for films with a comparable ${X.label.toLowerCase()}.`}
 const xv=X.f(f),pct=Math.round(VIS.filter(o=>X.f(o)<xv).length/(VIS.length||1)*100);return s+` Its ${X.label.toLowerCase()} is higher than ${pct}% of films in view.`}
// Poster art and trailers. A film's IMDb ID is matched on Wikidata to its English Wikipedia article (the poster is
// the article's lead image) and to any YouTube video ID recorded there with the role "trailer". Lookups run only
// when a card opens and are kept for the visit; without a match the card keeps its placeholder and a YouTube search.
const MEDIA=new Map();
function mediaFor(f){const tt=((f.imdbUrl||'').match(/tt\d+/)||[])[0];if(!tt)return Promise.resolve(null);if(MEDIA.has(tt))return MEDIA.get(tt);
 const q=`SELECT ?article ?yt ?role WHERE{?film wdt:P345 "${tt}".OPTIONAL{?article schema:about ?film;schema:isPartOf <https://en.wikipedia.org/>}OPTIONAL{?film p:P1651 ?st.?st ps:P1651 ?yt.OPTIONAL{?st pq:P3831 ?role}}}LIMIT 20`;
 const p=fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q)).then(r=>r.ok?r.json():null).then(async j=>{
  const rows=j?.results?.bindings||[];if(!rows.length)return null;
  const art=rows.find(r=>r.article)?.article.value||'',tr=rows.find(r=>r.yt&&r.role&&/\/Q622550$/.test(r.role.value));
  const out={article:art,trailer:tr?tr.yt.value:null,poster:null,file:null};
  const title=art?decodeURIComponent(art.split('/wiki/')[1]||''):'';
  if(title){const w=await fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=360&pilicense=any&titles='+encodeURIComponent(title)).then(r=>r.ok?r.json():null).catch(()=>null);
   const pg=w&&Object.values(w.query?.pages||{})[0];if(pg&&pg.thumbnail){out.poster=pg.thumbnail.source;out.file=pg.pageimage||null}}
  return out}).catch(()=>null);
 MEDIA.set(tt,p);return p}
function applyMedia(f){mediaFor(f).then(m=>{if(S.sel!==f||!m)return;
 const po=card.querySelector('.poster');
 if(m.poster&&po&&!po.querySelector('img')){const img=new Image();img.alt='Poster for '+f.title;img.decoding='async';img.onload=()=>{if(S.sel===f){po.replaceChildren(img);po.classList.add('has')}};img.src=m.poster}
 const tl=card.querySelector('[data-trailer]');if(m.trailer&&tl){tl.href='https://www.youtube.com/watch?v='+encodeURIComponent(m.trailer);tl.textContent='▶ Watch the trailer on YouTube ↗'}
 const cr=card.querySelector('[data-postercredit]');if(m.poster&&m.file&&cr){const a=document.createElement('a');a.href='https://en.wikipedia.org/wiki/File:'+encodeURIComponent(m.file.replace(/ /g,'_'));a.target='_blank';a.rel='noopener noreferrer';a.textContent='Poster: Wikipedia ↗';cr.replaceChildren(' · ',a)}})}
function renderCard(){const f=S.sel;card.classList.toggle('open',(!!f||S.people.length>0)&&S.mode!=='rel');if(!f){if(S.people.length)renderPeopleCard();return}
 const n=(l,v)=>`<div class="nm"><dt>${l}</dt><dd>${v}</dd></div>`;
 const val=v=>v?esc(v):'—';
 const link=(url,label)=>/^https:\/\//.test(url)?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`:'';
 const why=whyText(f);
 card.innerHTML=`<button class="x" data-close="1" aria-label="Close">×</button>
${S.people.length?`<button class="linkb backp" data-backp="1">← Back to ${S.people.map(p=>esc(p.name)).join(' & ')}</button>`:''}<div class="ch"><div class="poster">${f.year}<br>FILM</div><div><div class="kick">${f.date||f.year} · Domestic rank ${f.rank} in source</div><h2 class="ct">${esc(f.title)}</h2><div class="csub">${esc(f.genre)} · ${esc(f.studio)}</div><a class="trailer" data-trailer="1" href="https://www.youtube.com/results?search_query=${encodeURIComponent(f.title+' '+f.year+' official trailer')}" target="_blank" rel="noopener noreferrer">▶ Find the trailer on YouTube ↗</a></div></div>
${f.streaming?`<div class="sec note"><div class="k">Streaming-first release</div><p>Released mainly on ${esc(f.streaming)}. Box office reflects only a limited cinema run, not the film's audience, so it is left out of box-office trends and outliers.</p></div>`:''}<div class="sec"><div class="k">The numbers · nominal USD</div><dl class="nums">${n('Production budget',fmtM(f.budget))}${n('Marketing budget','—')}${n('Total budget','—')}${n('Worldwide box office',fmtM(f.ww))}${n('Opening weekend',fmtM(f.open))}${n('Domestic',fmtM(f.dom))}${n('International',fmtM(f.intl)+(f.intlShare!=null?' <small>'+Math.round(f.intlShare)+'%</small>':''))}${f.intlNote?'</dl><p class="fine intlnote">International: '+esc(f.intlNote)+'</p><dl class="nums">':''}${n('Tomatometer',VARS.tomato.fmt(f.tomato))}${n('Popcornmeter',VARS.popcorn.fmt(f.popcorn))}${n('IMDb rating',VARS.imdb.fmt(f.imdb))}${n('Gross ÷ production budget',VARS.ratio.fmt(f.ratio))}</dl></div>
${why?`<div class="sec why2"><div class="k">Why is it here?</div><p>${why}</p></div>`:''}
<div class="sec"><div class="k">The context</div><dl class="cx"><dt>Genre tags</dt><dd>${val(f.genres)}</dd><dt>Production companies</dt><dd>${val(f.companies)}</dd><dt>Director</dt><dd>${val(f.directors)}</dd><dt>Top-billed cast</dt><dd>${val(f.stars)}</dd><dt>Movie universe</dt><dd>—</dd><dt>Parent company</dt><dd>—</dd><dt>MPA rating</dt><dd>${esc(f.mpa)}</dd><dt>Runtime</dt><dd>${f.runtime==null?'—':f.runtime+' min'}</dd><dt>Oscar nominations / wins</dt><dd>${f.oscars} / ${f.wins}</dd>${f.award?`<dt>Winning categories</dt><dd>${esc(f.award)}</dd>`:''}</dl></div>
<div class="sec"><div class="k">Find its neighbors</div><p class="fine">Films statistically closest across the traits you choose.</p><div class="chips">${Object.keys(NBD).map(k=>`<button class="chip${S.nbDims.has(k)?' on':''}" data-nbd="${k}">${NBD[k]}</button>`).join('')}</div>
<div class="brow"><button class="btn" data-nb="1">${S.nb?'Update neighbors':'Show similar films'}</button>${S.nb?'<button class="btn alt" data-nbclear="1">Clear</button>':''}</div>
${S.nb?`<div class="olist">${S.nb.map(o=>`<button data-pick="${o.id}"><i class="dot" style="background:${o.col}"></i><span>${esc(nameOf(o))}</span><small>${o.year} · ${o.genre}</small></button>`).join('')}</div>`:''}</div>
<div class="sec"><div class="k">Sources for this record</div><p class="fine">Budget: ${val(f.budgetSource)}${f.budgetStatus?' ('+esc(f.budgetStatus)+')':''} · Domestic: ${val(f.domesticSource)} · Worldwide: ${val(f.worldwideSource)}${f.rtDate?' · RT snapshot: '+esc(f.rtDate):''}.</p>${f.dataNotes?`<p class="fine">${esc(f.dataNotes)}</p>`:''}<p class="fine">${[link(f.sourceUrl,'Film source'),link(f.rtUrl,'Rotten Tomatoes'),link(f.imdbUrl,'IMDb')].filter(Boolean).join(' · ')}<span data-postercredit="1"></span></p></div>`;applyMedia(f)}
card.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.close)clearSel();else if(d.backp){S.sel=null;peopleFocus();commit();card.scrollTop=0}else if(d.pdrop!==undefined)dropPerson(+d.pdrop);else if(d.pick!==undefined)selectFilm(FILMS[+d.pick],!!S.nb);
 else if(d.nbd){S.nbDims.has(d.nbd)?S.nbDims.delete(d.nbd):S.nbDims.add(d.nbd);if(!S.nbDims.size)S.nbDims.add('genre');if(S.nb)runNb();else renderCard()}
 else if(d.nb)runNb();else if(d.nbclear){S.nb=null;S.focus=null;commit()}});
function runNb(){const f=S.sel;if(!isScatter())setMode('explore');S.nb=neighbors(f);S.focus=new Set([f.id,...S.nb.map(o=>o.id)]);commit()}
function selectFilm(f,keepNb){S.sel=f;if(keepNb&&S.nb&&S.nb.includes(f)){}else{S.nb=null;if(S.people.length&&!S.people.some(p=>p.ids.includes(f.id)))S.people=[];if(S.focus&&!S.focus.has(f.id))S.focus=null}commit();card.scrollTop=0}
function clearSel(){if(S.sel&&S.people.length){S.sel=null;S.nb=null;peopleFocus();commit();return}S.sel=null;S.nb=null;S.people=[];S.focus=null;commit()}
function flyTo(f){if(!f.ok||!f.win){for(const k in S.hide)S.hide[k].clear();S.yr=S.mode==='time'?[f.year,Math.min(2025,f.year+4)]:[2001,2025]}
 if(!isFinite(tv(VARS[S.x],f))||!isFinite(tv(VARS[S.y],f))){S.x='year';S.y='dom';resetZoom()}
 if(!isScatter())setMode('explore');S.sel=f;S.nb=null;S.people=[];S.focus=new Set([f.id]);commit();VT.k=3.2;VT.cx=clamp(f.tu,0,1);VT.cy=clamp(f.tv,0,1);need=3}

/* ---------- people: directors and top-billed cast ---------- */
// Every director and top-billed actor (first five billed) with the films they have in this sample. Pick one to focus
// their films on the chart and open a career card; pick a second to compare the two, or to see their films together.
const PEOPLE=(()=>{const m=new Map(),add=(role,name,f)=>{const k=role+'|'+name;let p=m.get(k);if(!p)m.set(k,p={key:k,role,name,lname:name.toLowerCase(),ids:[]});if(!p.ids.includes(f.id))p.ids.push(f.id)};
 for(const f of FILMS){for(const n of (f.directors||'').split(', '))if(n.trim())add('Director',n.trim(),f);for(const n of (f.stars||'').split(', '))if(n.trim())add('Cast',n.trim(),f)}
 return [...m.values()]})();
const PCOL=['#E8A83E','#6FD3E6'];
function peopleFocus(){S.focus=S.people.length?new Set(S.people.flatMap(p=>p.ids)):null}
function pickPerson(p){if(S.people.some(x=>x.key===p.key))return;if(S.people.length>=2)S.people[1]=p;else S.people.push(p);
 S.sel=null;S.nb=null;peopleFocus();if(S.mode==='rel')setMode('explore');commit();card.scrollTop=0}
function dropPerson(i){S.people.splice(i,1);peopleFocus();commit()}
const HIT=2.5;
function careerStats(list){const box=list.filter(f=>!f.streaming),r=box.filter(f=>f.budget>0&&f.ww>0),ys=list.map(f=>f.year),sum=a=>a.reduce((s,v)=>s+v,0);
 const ww=box.filter(f=>f.ww>0);
 return {n:list.length,y0:Math.min(...ys),y1:Math.max(...ys),total:ww.length?sum(ww.map(f=>f.ww)):NaN,mww:median(box.map(f=>f.ww)),mbud:median(list.map(f=>f.budget)),
  mratio:median(r.map(f=>f.ratio)),hitK:r.filter(f=>f.ratio>=HIT).length,hitN:r.length,tomato:median(list.map(f=>f.tomato)),popcorn:median(list.map(f=>f.popcorn)),imdb:median(list.map(f=>f.imdb)),
  noms:sum(list.map(f=>f.oscars||0)),wins:sum(list.map(f=>f.wins||0)),best:ww.slice().sort((a,b)=>b.ww-a.ww)[0]||null,worst:r.slice().sort((a,b)=>a.ratio-b.ratio)[0]||null}}
let ALLSTATS=null;
function renderPeopleCard(){const P=S.people,lists=P.map(p=>p.ids.map(id=>FILMS[id])),st=lists.map(careerStats);ALLSTATS=ALLSTATS||careerStats(FILMS);const A=ALLSTATS;
 const both=P.length===2?lists[0].filter(f=>P[1].ids.includes(f.id)):[];
 const fx=v=>isFinite(v)?(Math.round(v*10)/10)+'×':'—',pc=v=>isFinite(v)?Math.round(v)+'%':'—',im=v=>isFinite(v)?v.toFixed(1):'—',tot=v=>isFinite(v)?fmtM(v):'—';
 const rows=[['Films in this sample',s=>s.n.toLocaleString(),'2,496'],['Years',s=>s.y0===s.y1?s.y0:s.y0+'–'+s.y1,'2001–2025'],['Total worldwide gross',s=>tot(s.total),'—'],
  ['Median worldwide gross',s=>tot(s.mww)],['Median production budget',s=>tot(s.mbud)],['Median gross ÷ budget',s=>fx(s.mratio)],
  [`Hit rate · grossed ≥ ${HIT}× budget`,s=>s.hitN?Math.round(s.hitK/s.hitN*100)+'% <small>'+s.hitK+' of '+s.hitN+'</small>':'—'],
  ['Median Tomatometer',s=>pc(s.tomato)],['Median Popcornmeter',s=>pc(s.popcorn)],['Median IMDb rating',s=>im(s.imdb)],['Oscar nominations / wins',s=>s.noms+' / '+s.wins,'—']];
 const head=`<tr><th></th>${P.map((p,i)=>`<th><i class="dot" style="background:${PCOL[i]}"></i>${esc(p.name.split(' ').slice(-1)[0])}</th>`).join('')}<th>All films</th></tr>`;
 const body=rows.map(([l,fn,all])=>`<tr><td>${l}</td>${st.map(s=>`<td>${fn(s)}</td>`).join('')}<td class="mu">${all??fn(A)}</td></tr>`).join('');
 const fl=[...new Set(lists.flat())].sort((a,b)=>(a.date||String(a.year)).localeCompare(b.date||String(b.year)));
 const mx=Math.max(...fl.map(f=>f.ratio||0),HIT*2);
 const frow=f=>{const inA=P[0].ids.includes(f.id),inB=P[1]&&P[1].ids.includes(f.id),c=inA&&inB?'#F2EBDD':inB?PCOL[1]:PCOL[0];
  return `<button data-pick="${f.id}"><span><i class="dot" style="background:${c}"></i>${esc(nameOf(f))}${f.streaming?' <em class="mu">streaming</em>':''}</span><small>${f.year}</small><small>${f.ww>0?fmtM(f.ww):'—'}</small><i class="rb" title="Gross ÷ production budget: ${fx(f.ratio)}"><b style="width:${f.ratio?Math.min(100,f.ratio/mx*100):0}%;background:${f.ratio>=HIT?'#6FD0A8':'#F08A5E'}"></b></i></button>`};
 const title=P.length===2?`${esc(P[0].name)} <em class="amp">&amp;</em> ${esc(P[1].name)}`:esc(P[0].name);
 const hl=(s,i)=>s.best?`<p><i class="dot" style="background:${PCOL[i]}"></i> Biggest hit: <button class="linkb" data-pick="${s.best.id}">${esc(nameOf(s.best))}</button> (${fmtM(s.best.ww)})${s.worst&&s.worst!==s.best?` · Weakest return: <button class="linkb" data-pick="${s.worst.id}">${esc(nameOf(s.worst))}</button> (${fx(s.worst.ratio)} budget)`:''}</p>`:'';
 card.innerHTML=`<button class="x" data-close="1" aria-label="Close">×</button>
<div><div class="kick">${P.map(p=>p.role).join(' & ')} · career in this sample</div><h2 class="ct">${title}</h2>
<div class="pchips">${P.map((p,i)=>`<button class="pchip" data-pdrop="${i}" title="Remove ${esc(p.name)}"><i class="dot" style="background:${PCOL[i]}"></i>${esc(p.name)} · ${p.role} <span>×</span></button>`).join('')}</div>
<p class="fine">${P.length<2?'Search another director or actor to compare them, or to see their films together.':'Search another name to replace the second person.'}</p></div>
${P.length===2?`<div class="sec"><div class="k">Together</div><p>${both.length?`${both.length} film${both.length>1?'s':''} with both: `+both.map(f=>`<button class="linkb" data-pick="${f.id}">${esc(nameOf(f))}</button>`).join(', ')+'.':'No films with both in this sample.'}</p></div>`:''}
<div class="sec"><div class="k">How their films performed · nominal USD</div><table class="ptab">${head}${body}</table>${st.map(hl).join('')}</div>
<div class="sec"><div class="k row">Their films<span class="kh">Gross ÷ budget</span></div><div class="olist pfl">${fl.map(frow).join('')}</div></div>
<div class="sec"><p class="fine">Only each year's top-grossing films are in this sample, so flops and small releases are mostly missing and hit rates look better than full careers. Cast means the first five billed names. Co-directed films count for each director. Streaming-first films are left out of box-office figures.</p></div>`}

/* ---------- search ---------- */
const q=$('q'),qr=$('qr');let qi=0,qres=[];
function renderQ(){const s=q.value.trim().toLowerCase();if(!s){qr.hidden=true;return}
 const films=FILMS.filter(f=>f.title&&f.title.toLowerCase().includes(s)).slice(0,5).map(f=>({f}));
 const who=s.length<2?[]:PEOPLE.filter(p=>p.lname.includes(s)).sort((a,b)=>(b.lname.startsWith(s)||b.lname.includes(' '+s))-(a.lname.startsWith(s)||a.lname.includes(' '+s))||b.ids.length-a.ids.length);
 const dirs=who.filter(p=>p.role==='Director').slice(0,4).map(p=>({p})),cast=who.filter(p=>p.role==='Cast').slice(0,4).map(p=>({p}));
 const top=l=>l.length?l[0].p.ids.length:0,grp=[['Films',films]].concat(top(cast)>top(dirs)?[['Top-billed cast',cast],['Directors',dirs]]:[['Directors',dirs],['Top-billed cast',cast]]);
 qres=grp.flatMap(g=>g[1]);qi=Math.min(qi,Math.max(0,qres.length-1));
 const row=(r,i)=>r.f?`<button data-i="${i}" class="${i===qi?'on':''}"><b>${esc(r.f.title)}</b><small>${r.f.year} · ${esc(r.f.genre)}</small></button>`
  :`<button data-i="${i}" class="${i===qi?'on':''}"><b>${esc(r.p.name)}</b><small>${r.p.ids.length} film${r.p.ids.length>1?'s':''}</small></button>`;
 let h='',i=0;for(const [lab,list] of grp){if(!list.length)continue;h+=`<div class="qh">${lab}</div>`+list.map(r=>row(r,i++)).join('')}
 qr.innerHTML=h||`<p class="fine">No film, director or top-billed actor matches this in the ${FILMS.length.toLocaleString()}-film dataset.</p>`;qr.hidden=false}
q.addEventListener('input',()=>{qi=0;renderQ()});q.addEventListener('focus',renderQ);
q.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){qi=Math.min(qi+1,qres.length-1);renderQ();e.preventDefault()}else if(e.key==='ArrowUp'){qi=Math.max(0,qi-1);renderQ();e.preventDefault()}else if(e.key==='Enter'&&qres[qi]){pickQ(qres[qi])}else if(e.key==='Escape'){q.blur();qr.hidden=true}});
qr.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b){e.preventDefault();pickQ(qres[+b.dataset.i])}});
q.addEventListener('blur',()=>setTimeout(()=>qr.hidden=true,120));
function pickQ(r){qr.hidden=true;q.blur();if(r.p){q.value='';pickPerson(r.p)}else{q.value=r.f.title;flyTo(r.f)}}

/* ---------- timeline ---------- */
const tlt=$('tlt');
function renderTL(){const [a,b]=S.yr,col=y=>(y-2001)/25*100;
 $('ha').style.left=col(a+.5)+'%';$('hb').style.left=col(b+.5)+'%';$('tlrng').style.left=col(a)+'%';$('tlrng').style.width=(col(b+1)-col(a))+'%';
 $('tlread').textContent=a===b?a:a+'–'+b;$('tlk').textContent=S.mode==='time'?TMET[S.tmetric][0]:'Years';
 const cw=tlt.clientWidth/25;$('tlctx').innerHTML=S.layers.context?CTXB.map(([x,y,l])=>`<span class="ctxb" title="${l}" style="left:${col(x)}%;width:${col(y+1)-col(x)}%">${cw*(y-x+1)>l.length*6.4+8?l:''}</span>`).join(''):'';
 const bars=$('tlbars');if(S.mode==='time'){const [lab,fn]=TMET[S.tmetric];const vals=[];for(let y=2001;y<=2025;y++)vals.push(fn(FILMS.filter(f=>f.ok&&f.year===y)));const lo=Math.min(0,...vals.filter(isFinite)),hi=Math.max(...vals.filter(isFinite))||1;
  bars.innerHTML=vals.map((v,i)=>`<i class="${2001+i>=a&&2001+i<=b?'in':''}" style="height:${isFinite(v)?Math.max(4,(v-lo)/(hi-lo)*100):0}%" title="${2001+i}: ${TMET[S.tmetric][2](v)}"></i>`).join('');app.classList.add('tlbars')}
 else{bars.innerHTML='';app.classList.remove('tlbars')}
 $('play').innerHTML=S.playing?'<svg width="12" height="12"><rect x="1" y="1" width="3.5" height="10" fill="currentColor"/><rect x="7.5" y="1" width="3.5" height="10" fill="currentColor"/></svg>':'<svg width="12" height="12"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>'}
$('tlyrs').innerHTML=Array.from({length:25},(_,i)=>`<span>${(i%4===0||i===24)?2001+i:''}</span>`).join('');
let tdrag=null;const yAt=x=>{const r=tlt.getBoundingClientRect();return clamp(2001+Math.floor((x-r.left)/r.width*25),2001,2025)};
tlt.addEventListener('pointerdown',e=>{const y=yAt(e.clientX),[a,b]=S.yr;let mode;if(e.target.id==='ha')mode='a';else if(e.target.id==='hb')mode='b';else if(y>=a&&y<=b&&b>a)mode='m';else mode=Math.abs(y-a)<=Math.abs(y-b)?'a':'b';
 tdrag={mode,y0:y,a,b};tlt.setPointerCapture(e.pointerId);if(mode!=='m')moveTL(e.clientX);stopPlay()});
tlt.addEventListener('pointermove',e=>{if(tdrag)moveTL(e.clientX)});
tlt.addEventListener('pointerup',()=>tdrag=null);
function moveTL(x){const y=yAt(x),d=tdrag;let [a,b]=S.yr;if(d.mode==='a')a=Math.min(y,b);else if(d.mode==='b')b=Math.max(y,a);else{const w=d.b-d.a,s=clamp(d.a+(y-d.y0),2001,2025-w);a=s;b=s+w}
 if(a!==S.yr[0]||b!==S.yr[1]){S.yr=[a,b];if(S.mode!=='time')S.yrPrev=null;commit()}}
function startPlay(){if(S.mode!=='time')setMode('time');const step=()=>{let [a,b]=S.yr;const w=b-a;if(b>=2025){a=2001;b=2001+w}else{a++;b++}S.yr=[a,b];commit()};S.playing=setInterval(step,1500);renderPanel();renderTL()}
function stopPlay(){if(S.playing){clearInterval(S.playing);S.playing=null;if(S.mode==='time')renderPanel();renderTL()}}
$('play').addEventListener('click',()=>S.playing?stopPlay():startPlay());

/* ---------- chrome ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));
$('ptog').addEventListener('click',()=>{S.panel=!S.panel;commit()});
$('clearf').addEventListener('click',()=>{S.focus=null;S.nb=null;S.people=[];if(S.sel&&!S.sel)S.sel=null;resetZoom();commit()});
$('zc').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const z=b.dataset.z;if(z==='reset')resetZoom();else zoomAt((P.x0+P.x1)/2,(P.y0+P.y1)/2,z==='in'?1.6:1/1.6)});
$('notesBtn').addEventListener('click',()=>$('notes').showModal());$('notesX').addEventListener('click',()=>$('notes').close());
addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key==='/'){e.preventDefault();q.focus()}else if(e.key==='Escape'&&S.sel)clearSel();else if(e.key==='Escape'&&(S.focus||S.people.length)){S.focus=null;S.people=[];commit()}});
addEventListener('resize',()=>{resize();renderPanel()});
resize();commit();requestAnimationFrame(frame);
if(document.fonts)document.fonts.ready.then(()=>{need=3});
