(function(){
const NS='http://www.w3.org/2000/svg';
const FONT_CSS='https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Patrick+Hand+SC&family=Yellowtail&family=Archivo:wght@800&display=swap';
const VB=[-40,-87.5,1180,1475];
const SIZES={social:{w:1080,h:1350,dpi:0,file:'john-hughes-chicagoland-social-1080x1350.png'},poster:{w:4800,h:6000,dpi:300,file:'john-hughes-chicagoland-poster-16x20in-300dpi.png'}};
let fontP=null;
const toData=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
function fonts(){if(fontP)return fontP;fontP=(async()=>{let css=await(await fetch(FONT_CSS)).text();const urls=[...new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)'"\s]+/g)||[])];const map={};await Promise.all(urls.map(async u=>{map[u]=await toData(await(await fetch(u)).blob())}));urls.forEach(u=>css=css.split(u).join(map[u]));return css})().catch(e=>{fontP=null;console.warn('Font embedding failed',e);return ''});return fontP}
let CRC;function crc32(buf){if(!CRC){CRC=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRC[n]=c>>>0}}let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=CRC[(c^buf[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
async function withDpi(blob,dpi){const src=new Uint8Array(await blob.arrayBuffer());const ppm=Math.round(dpi/0.0254);const ch=new Uint8Array(21);const dv=new DataView(ch.buffer);dv.setUint32(0,9);ch.set([112,72,89,115],4);dv.setUint32(8,ppm);dv.setUint32(12,ppm);ch[16]=1;dv.setUint32(17,crc32(ch.subarray(4,17)));const out=new Uint8Array(src.length+21);out.set(src.subarray(0,33),0);out.set(ch,33);out.set(src.subarray(33),54);return new Blob([out],{type:'image/png'})}
async function render(kind,opt={}){const S=SIZES[kind];const src=document.getElementById('map');const c=src.cloneNode(true);
c.setAttribute('viewBox',VB.join(' '));c.setAttribute('width',S.w);c.setAttribute('height',S.h);c.setAttribute('xmlns',NS);c.setAttribute('preserveAspectRatio','xMidYMid slice');
c.classList.remove('panning','away');c.querySelectorAll('.pin.on,.pin.dim').forEach(p=>p.classList.remove('on','dim'));const rt=c.querySelector('.route');if(rt)rt.innerHTML='';
c.querySelectorAll('.cards,.pin.oncard,.pin.off,.lead.off').forEach(n=>n.remove());
if(kind==='poster'){c.querySelectorAll('.pin').forEach(p=>{const ic=p.querySelector('.ic');if(ic)ic.insertAdjacentHTML('afterbegin',`<circle cy="-4" r="15" fill="${p.getAttribute('data-c')}" opacity=".33"/>`)});
const used=new Set();c.querySelectorAll('.pin').forEach(p=>(p.getAttribute('data-f')||'').split(',').forEach(f=>used.add(f)));const films=((window.HData&&window.HData.films)||[]).filter(f=>used.has(f.id));
if(films.length){const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));const X=752,Y0=252,LH=17.6;let g=`<g class="legend"><text x="${X}" y="${Y0}" class="bg" font-size="13" fill="#2B3A4A" letter-spacing=".14em" stroke="#A9D4E4" stroke-width="3" paint-order="stroke">THE FILMS</text>`;films.forEach((f,i)=>{const y=Y0+18+i*LH;g+=`<circle cx="${X+5}" cy="${y-4.4}" r="5.4" fill="${f.color}" stroke="#fff" stroke-width="1.2"/><text x="${X+16}" y="${y}" class="bg" font-size="13.5" fill="#2B3A4A" stroke="#A9D4E4" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(f.title)} <tspan fill="#3B6A82" font-size="11.5">${f.year}</tspan></text>`});g+='</g>';const cart=c.querySelector('.cart');(cart||c).insertAdjacentHTML('beforeend',g)}}
const hd=c.querySelector('#hd');if(hd){hd.classList.remove('walking');hd.setAttribute('transform','translate(492,1250) scale(.7) translate(-30,-92)')}
const css=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
const st=document.createElementNS(NS,'style');st.textContent=(await fonts())+css+`#map{position:static!important;inset:auto!important;width:${S.w}px!important;height:${S.h}px!important}*{transition:none!important;animation:none!important}`;c.insertBefore(st,c.firstChild);
const xml=new XMLSerializer().serializeToString(c);
const img=new Image();img.decoding='sync';
await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Could not draw the map image'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml)});
await new Promise(r=>setTimeout(r,120));
const cv=document.createElement('canvas');cv.width=S.w;cv.height=S.h;const ctx=cv.getContext('2d');ctx.fillStyle='#F3EAD7';ctx.fillRect(0,0,S.w,S.h);ctx.drawImage(img,0,0,S.w,S.h);
if(opt.canvas)return cv;let blob=await new Promise((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error('Image too large for this browser')),'image/png'));
if(S.dpi)blob=await withDpi(blob,S.dpi);
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=S.file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const btn=document.getElementById('dlBtn'),menu=document.getElementById('dlm'),stat=document.getElementById('dlst'),DEF=stat.textContent;
function setOpen(o){menu.hidden=!o;btn.setAttribute('aria-expanded',o)}
btn.onclick=e=>{e.stopPropagation();setOpen(menu.hidden);if(!menu.hidden)fonts()};
document.addEventListener('click',e=>{if(!menu.hidden&&!e.target.closest('.dl'))setOpen(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
menu.querySelectorAll('[data-ex]').forEach(b=>b.onclick=async()=>{const bs=menu.querySelectorAll('[data-ex]');bs.forEach(x=>x.disabled=true);stat.textContent=b.dataset.ex==='poster'?'Rendering 4800 × 6000… this can take a few seconds.':'Rendering…';
try{await render(b.dataset.ex);stat.textContent='Downloaded. '+DEF}catch(err){console.error(err);stat.textContent=err.message+'. Try the social size, or another browser.'}finally{bs.forEach(x=>x.disabled=false)}});
window.HExport={render};
})();
