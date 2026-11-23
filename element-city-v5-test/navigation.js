/** GPS-style route along Element City's street grid. Pure functions; no DOM.
 * Used by the radar (minimap) and the on-street guide line. */
export const ROAD_X=[450,1200,1950], ROAD_Y=[400,950,1500];
export const ROAD_EXTENT={minX:28,maxX:2250,minY:55,maxY:1770};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Nearest point on any street centreline. */
export function snapToRoad(p){
  let best=null;
  for(const x of ROAD_X){const q={x,y:clamp(p.y,ROAD_EXTENT.minY,ROAD_EXTENT.maxY),line:'x'+x};const d=Math.hypot(p.x-q.x,p.y-q.y);if(!best||d<best.d)best={...q,d}}
  for(const y of ROAD_Y){const q={x:clamp(p.x,ROAD_EXTENT.minX,ROAD_EXTENT.maxX),y,line:'y'+y};const d=Math.hypot(p.x-q.x,p.y-q.y);if(!best||d<best.d)best={...q,d}}
  return best;
}
const onLine=(n,line)=>line[0]==='x'?Math.abs(n.x-Number(line.slice(1)))<1e-6:Math.abs(n.y-Number(line.slice(1)))<1e-6;

/** Shortest street route from `from` to `to`. Returns an array of {x,y} points
 * starting at `from` and ending at `to`; consecutive interior points share a street. */
export function routeTo(from,to){
  if(!from||!to)return [];
  const a=snapToRoad(from),b=snapToRoad(to);
  if(Math.hypot(from.x-to.x,from.y-to.y)<Math.max(60,a.d+b.d))return [{x:from.x,y:from.y},{x:to.x,y:to.y}];
  const nodes=[{x:a.x,y:a.y},{x:b.x,y:b.y}];
  for(const x of ROAD_X)for(const y of ROAD_Y)nodes.push({x,y});
  const lines=[...ROAD_X.map(x=>'x'+x),...ROAD_Y.map(y=>'y'+y)];
  const edges=nodes.map(()=>[]);
  for(const line of lines){
    const on=nodes.map((n,i)=>[n,i]).filter(([n])=>onLine(n,line)).sort(([p],[q])=>line[0]==='x'?p.y-q.y:p.x-q.x);
    for(let k=1;k<on.length;k++){const [p,i]=on[k-1],[q,j]=on[k],d=Math.hypot(p.x-q.x,p.y-q.y);edges[i].push([j,d]);edges[j].push([i,d])}
  }
  const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();dist[0]=0;
  while(done.size<nodes.length){let u=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u<0||dist[u]===Infinity)break;done.add(u);for(const [v,d] of edges[u])if(dist[u]+d<dist[v]){dist[v]=dist[u]+d;prev[v]=u}}
  if(dist[1]===Infinity)return [{x:from.x,y:from.y},{x:to.x,y:to.y}];
  const chain=[];for(let i=1;i>=0;i=prev[i]){chain.unshift({x:nodes[i].x,y:nodes[i].y});if(i===0)break}
  const out=[{x:from.x,y:from.y},...chain,{x:to.x,y:to.y}];
  return out.filter((p,i)=>i===0||Math.hypot(p.x-out[i-1].x,p.y-out[i-1].y)>.5);
}
export const routeLength=pts=>pts.reduce((s,p,i)=>i?s+Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y):0,0);
