(()=>{'use strict';
const geometry={"outline":"M291 37 349 54 407 134 421 218 471 297 453 359 492 470 461 579 422 632 405 731 333 831 274 865 213 812 187 728 135 664 123 555 99 475 130 369 117 271 166 241 177 157 238 128 261 68Z","lines":["M291 37 268 164 207 198 190 286 252 343 211 465 249 558 211 693 274 865","M349 54 329 186 382 278 351 377 405 483 367 615 405 731","M177 157 207 198 166 241 190 286 117 271","M407 134 329 186 268 164 238 128","M421 218 382 278 471 297","M130 369 190 286 252 343 351 377 453 359","M99 475 211 465 252 343 329 186","M123 555 249 558 351 377 405 483 492 470","M135 664 211 693 249 558 367 615 461 579","M187 728 211 693 301 741 367 615 422 632","M213 812 301 741 333 831","M301 741 405 731","M261 68 268 164","M207 198 252 343","M382 278 252 343","M211 465 405 483","M249 558 301 741","M274 865 301 741"]};
const body=document.body,canvas=document.querySelector('.rock-canvas'),ctx=canvas?.getContext('2d'),hero=document.querySelector('.hero'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let time=0,last=0,raf=0,w=0,h=0,dpr=1;
// Two faceted convex surfaces share ONE perimeter, including the bottom tip.
// All intersecting face lines are split and welded before depth is assigned.
const points=[],edges=[],lookup=new Map();
function coords(d){return [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]);}
const outline=coords(geometry.outline),segments=[];
function segment(a,b,kind){segments.push({a,b,kind,cuts:[0,1]});}
for(let i=0;i<outline.length;i++)segment(outline[i],outline[(i+1)%outline.length],'outline');
// Keep the main original facets; omit six decorative diagonals to avoid visual clutter.
for(const d of geometry.lines.slice(0,12)){const p=coords(d);for(let i=1;i<p.length;i++)segment(p[i-1],p[i],'face');}
function cross(a,b){return a[0]*b[1]-a[1]*b[0];}
for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
 const A=segments[i],B=segments[j],r=[A.b[0]-A.a[0],A.b[1]-A.a[1]],s=[B.b[0]-B.a[0],B.b[1]-B.a[1]],q=[B.a[0]-A.a[0],B.a[1]-A.a[1]],den=cross(r,s);
 if(Math.abs(den)<1e-8)continue;const t=cross(q,s)/den,u=cross(q,r)/den;if(t>=-1e-7&&t<=1+1e-7&&u>=-1e-7&&u<=1+1e-7){A.cuts.push(Math.max(0,Math.min(1,t)));B.cuts.push(Math.max(0,Math.min(1,u)));}
}
function distance(p){let best=Infinity;for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y)));best=Math.min(best,Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y));}return best;}
function node(p,back){const dist=distance(p),rim=dist<.01;const key=p.map(v=>v.toFixed(4)).join(',')+(rim?'rim':back?'back':'front');if(lookup.has(key))return lookup.get(key);
 const x=(p[0]-300)/410,y=(p[1]-450)/410;
 // Broad central volume, smoothly reduced near every edge; no extruded rear slab.
 const depth=.48*Math.sin(Math.min(1,dist/175)*Math.PI/2);const z=rim?0:back?-depth*(.92+.06*Math.sin(y*3+x*4)):depth;
 const id=points.length;points.push([x,y,z]);lookup.set(key,id);return id;}
const seen=new Set();function edge(a,b,kind){if(a===b)return;const key=[Math.min(a,b),Math.max(a,b)].join(':');if(seen.has(key))return;seen.add(key);edges.push([a,b,kind]);}
for(const seg of segments){const cuts=[...new Set(seg.cuts.map(v=>+v.toFixed(8)))].sort((a,b)=>a-b);for(let k=1;k<cuts.length;k++){const pos=t=>[seg.a[0]+(seg.b[0]-seg.a[0])*t,seg.a[1]+(seg.b[1]-seg.a[1])*t],a=pos(cuts[k-1]),b=pos(cuts[k]);edge(node(a,false),node(b,false),seg.kind==='outline'?'outline':'front');if(seg.kind!=='outline')edge(node(a,true),node(b,true),'rear');}}
const degrees=points.map(()=>0);for(const [a,b] of edges){degrees[a]++;degrees[b]++;}canvas?.setAttribute('data-mesh-check',JSON.stringify({vertices:points.length,edges:edges.length,dangling:degrees.filter(n=>n<2).length,sharedRim:true}));

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const inspecting=new URLSearchParams(location.search).has('inspect');
function render(t){if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const angle=t*.12,c=Math.cos(angle),s=Math.sin(angle),roll=-Math.PI/20,cr=Math.cos(roll),sr=Math.sin(roll),scale=Math.min(h*.43,w*(w<700?.62:.30));
const pp=points.map(([x,y,z])=>{const a=x*c+z*s,depth=-x*s+z*c;return{x:w/2+(a*cr-y*sr)*scale,y:h*.49+(a*sr+y*cr)*scale,z:depth};});const zmax=Math.max(...pp.map(p=>Math.abs(p.z)),.01),rearReveal=ease(Math.acos(clamp(c,-1,1))/.45),frontReveal=ease(Math.acos(clamp(-c,-1,1))/.45);
const sorted=edges.slice().sort((a,b)=>(pp[a[0]].z+pp[a[1]].z)-(pp[b[0]].z+pp[b[1]].z));let amin=1,amax=0;ctx.lineCap='round';ctx.lineJoin='round';
for(const [a,b,kind] of sorted){const p=pp[a],q=pp[b],depth=clamp(((p.z+q.z)/2/zmax+1)/2);let alpha=.045+.72*Math.pow(depth,1.7);if(kind==='outline')alpha*=.5+.5*Math.abs(c);if(kind==='rear')alpha*=rearReveal;if(kind==='front')alpha*=frontReveal;amin=Math.min(amin,alpha);amax=Math.max(amax,alpha);ctx.strokeStyle='rgba(255,255,255,'+alpha+')';ctx.lineWidth=.65+depth*.75;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
if(inspecting)canvas.dataset.motion=JSON.stringify({time:t,angle,nearAlpha:amax,farAlpha:amin,strokes:edges.length});}
function frame(now){raf=0;if(document.hidden||reduced.matches)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;render(time);raf=requestAnimationFrame(frame);}
function sync(){cancelAnimationFrame(raf);last=0;if(reduced.matches){render(0);}else if(!document.hidden&&ctx)raf=requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
if(ctx){body.classList.add('motion-ready');new ResizeObserver(()=>{const r=hero.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;render(reduced.matches?0:time);}).observe(hero);}
if(inspecting)window.mosiDemo={render(t){cancelAnimationFrame(raf);time=t;render(t);}};sync();})();
