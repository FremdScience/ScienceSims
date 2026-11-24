/** Original procedural city artwork and movement engine for Element City. */
export const WORLD = { width: 2400, height: 1800 };
export const stations = [
  { id: 'hq', name: 'Periodic Research Center', x: 510, y: 1050, code: 'HQ', color: '#6ee7cf' },
  { id: 'courier', name: 'Who Am I?', x: 450, y: 1250, code: '01', color: '#ffc46a' },
  { id: 'race', name: 'The Pull', x: 1200, y: 400, code: '02', color: '#ff7a59' },
  { id: 'power', name: 'Power to the Block', x: 850, y: 950, code: '03', color: '#ffd84a' },
  { id: 'show', name: 'Fountain Show', x: 2150, y: 950, code: '04', color: '#bcacf4' },
  { id: 'survey', name: 'OH So Acidic?', x: 300, y: 400, code: '05', color: '#77d7e6' },
  { id: 'ions', name: 'City of Ions', x: 1950, y: 400, code: '06', color: '#6ee7cf' },
];
export const buildings = [
 {x:100,y:125,w:215,h:175,hue:'#657b7c',name:'ALKALI WORKS',mark:'Li',height:26},
 {x:575,y:120,w:235,h:170,hue:'#778077',name:'VIRTUAL REACTIVITY LAB',mark:'Na',height:32},
 {x:880,y:140,w:175,h:150,hue:'#5e7e80',name:'CITY ARCHIVES',mark:'K',height:25},
 {x:1320,y:100,w:225,h:200,hue:'#6d738d',name:'FAMILY RESEARCH',mark:'F',height:40},
 {x:1640,y:150,w:165,h:155,hue:'#777f8e',name:'NOBLE LIGHT CO.',mark:'Ne',height:30},
 {x:2070,y:110,w:160,h:200,hue:'#4f8f8b',name:'ION GRID',mark:'O',height:32},
 {x:90,y:535,w:230,h:245,hue:'#657a72',name:'ALKALINE HEIGHTS',mark:'Mg',height:35},
 {x:585,y:550,w:200,h:260,hue:'#5a7e85',name:'TRANSIT CONTROL',mark:'Cu',height:44},
 {x:890,y:545,w:170,h:145,hue:'#777d7b',name:'ALLOY + CO.',mark:'Fe',height:32},
 {x:1325,y:540,w:205,h:280,hue:'#627f91',name:'TRANSITION TOWER',mark:'Zn',height:60},
 {x:1640,y:535,w:150,h:180,hue:'#9a8c74',name:'JUNCTION CAFÉ',mark:'S',height:27},
 {x:2070,y:540,w:160,h:290,hue:'#5b8588',name:'HARBOR EXCHANGE',mark:'Cl',height:35},
 {x:100,y:1115,w:235,h:250,hue:'#4c8580',name:'PERIODIC RESEARCH',mark:'P',height:40},
 {x:610,y:1090,w:175,h:145,hue:'#859084',name:'FIELD SUPPLY',mark:'C',height:22},
 {x:910,y:1100,w:160,h:260,hue:'#647d87',name:'METALLOID JUNCTION',mark:'Si',height:40},
 {x:1325,y:1080,w:180,h:180,hue:'#718587',name:'CIVIC LIBRARY',mark:'N',height:32},
 {x:1610,y:1100,w:175,h:260,hue:'#5e8688',name:'SIGNAL HOUSE',mark:'Ar',height:44},
 {x:2070,y:1070,w:165,h:290,hue:'#648b87',name:'SAMPLE DEPOT',mark:'Br',height:30},
 {x:90,y:1610,w:240,h:130,hue:'#5e7778',name:'FLEET GARAGE',mark:'Ca',height:20},
 {x:600,y:1610,w:200,h:120,hue:'#647974',name:'BOTANICAL LAB',mark:'I',height:25},
 {x:1320,y:1630,w:220,h:100,hue:'#73827b',name:'MATERIALS MUSEUM',mark:'Al',height:20},
 {x:1640,y:1620,w:160,h:120,hue:'#6c828b',name:'HARBOR RADIO',mark:'He',height:23},
];
const roadX=[450,1200,1950], roadY=[400,950,1500];
const ROAD=120;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function circleCollides(x,y,r=13,obstacles=buildings) {
 if(x-r<28 || y-r<55 || x+r>2250 || y+r>1770) return true;
 return obstacles.some(b=>Math.hypot(x-clamp(x,b.x,b.x+b.w),y-clamp(y,b.y,b.y+b.h))<r);
}
export function moveWithCollisions(x,y,dx,dy,r=13,obstacles=buildings) {
 let nx=x, ny=y, hit=false;
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/7));
 for(let i=0;i<steps;i++){
  if(!circleCollides(nx+dx/steps,ny,r,obstacles)) nx+=dx/steps; else hit=true;
  if(!circleCollides(nx,ny+dy/steps,r,obstacles)) ny+=dy/steps; else hit=true;
 }
 return {x:nx,y:ny,hit};
}
/** How much of a blocked move survives (0 head-on … 1 grazing): probes which axis is blocked after the move. */
export function collisionKeep(moved,dx,dy,r=13,obstacles=buildings){
 const L=Math.hypot(dx,dy);if(!L)return {keep:1,dir:0,blocked:false};const ux=dx/L,uy=dy/L,px=Math.max(1.5,Math.min(7,Math.abs(dx))),py=Math.max(1.5,Math.min(7,Math.abs(dy)));
 const bx=!!dx&&circleCollides(moved.x+Math.sign(dx)*px,moved.y,r,obstacles),by=!!dy&&circleCollides(moved.x,moved.y+Math.sign(dy)*py,r,obstacles);
 return {keep:Math.hypot(bx?0:ux,by?0:uy),dir:Math.atan2(by?0:uy,bx?0:ux),blocked:bx||by};
}
/** Element coins: one per periodic-table group, hidden at ground level in alleys, gaps and dead ends.
 * Ids 'hydrogen', 'graphite' and 'neon' are kept from earlier versions so old saves keep their finds. */
export const ELEMENT_COINS=[
 {id:'hydrogen',group:1,symbol:'H',x:130,y:92,label:'H / THE EXCEPTION'},
 {id:'magnesium',group:2,symbol:'Mg',x:58,y:760,label:'WEST WALL, ALKALINE HEIGHTS'},
 {id:'scandium',group:3,symbol:'Sc',x:838,y:740,label:'TRANSIT CONTROL BACK LOT'},
 {id:'titanium',group:4,symbol:'Ti',x:1585,y:780,label:'BEHIND TRANSITION TOWER'},
 {id:'vanadium',group:5,symbol:'V',x:1828,y:560,label:'CAFÉ SIDE PASSAGE'},
 {id:'chromium',group:6,symbol:'Cr',x:1360,y:78,label:'FAMILY RESEARCH REAR YARD'},
 {id:'manganese',group:7,symbol:'Mn',x:845,y:135,label:'ARCHIVES ALLEY'},
 {id:'iron',group:8,symbol:'Fe',x:1092,y:515,label:'ALLOY + CO. LOADING DOCK'},
 {id:'cobalt',group:9,symbol:'Co',x:1828,y:1130,label:'SIGNAL HOUSE SERVICE LANE'},
 {id:'nickel',group:10,symbol:'Ni',x:1570,y:1330,label:'LIBRARY GARDEN GATE'},
 {id:'copper',group:11,symbol:'Cu',x:560,y:590,label:'TRANSIT CONTROL WEST WALK'},
 {id:'zinc',group:12,symbol:'Zn',x:2215,y:1392,label:'DEPOT SEAWALL'},
 {id:'aluminum',group:13,symbol:'Al',x:1590,y:1748,label:'MUSEUM SOUTH STEPS'},
 {id:'graphite',group:14,symbol:'C',x:1380,y:1370,label:'CARBON GARDEN'},
 {id:'nitrogen',group:15,symbol:'N',x:1060,y:1405,label:'METALLOID JUNCTION YARD'},
 {id:'oxygen',group:16,symbol:'O',x:2090,y:80,label:'ION GRID ROOF ACCESS LANE'},
 {id:'chlorine',group:17,symbol:'Cl',x:2232,y:850,label:'HALOGEN HARBOR SEAWALL'},
 {id:'neon',group:18,symbol:'Ne',x:1790,y:100,label:'NEON AFTER HOURS'},
];
export const COIN_PICKUP=55;
/** Traffic signal cycle shared by the street lamps (3D) and the cars: 16 s, no all-red phase. */
export function signalPhase(t){const c=((t%16)+16)%16;return c<6.5?{ns:'green',ew:'red'}:c<8?{ns:'amber',ew:'red'}:c<14.5?{ns:'red',ew:'green'}:{ns:'red',ew:'amber'}}
// ---- ambient traffic: closed loops along the play grid, right-hand lanes 26 units off the centreline,
// with curved turns inside each intersection. Route 0 is the original clockwise outer loop.
const LANE=26,CORNER=60,STOP_LINE=92;
const OUTER=[[450,400],[1200,400],[1950,400],[1950,950],[1950,1500],[1200,1500],[450,1500],[450,950]];
const LOOPS=[OUTER,[...OUTER].reverse(),[[450,400],[1200,400],[1200,950],[450,950]],[[1200,400],[1950,400],[1950,950],[1200,950]],[[1200,950],[1950,950],[1950,1500],[1200,1500]],[[450,950],[1200,950],[1200,1500],[450,1500]]];
function buildRoute(loop){
 const n=loop.length,pts=[],nodes=[],dir=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);return [dx/l,dy/l]};
 for(let k=0;k<n;k++){const C=loop[k],d1=dir(loop[(k+n-1)%n],C),d2=dir(C,loop[(k+1)%n]),n1=[-d1[1],d1[0]],n2=[-d2[1],d2[0]];
  const pin=[C[0]+LANE*n1[0]-d1[0]*CORNER,C[1]+LANE*n1[1]-d1[1]*CORNER],pout=[C[0]+LANE*n2[0]+d2[0]*CORNER,C[1]+LANE*n2[1]+d2[1]*CORNER],q=[C[0]+LANE*(n1[0]+n2[0]),C[1]+LANE*(n1[1]+n2[1])];
  const turn=Math.abs(d1[0]*d2[0]+d1[1]*d2[1])<.5,i0=pts.length;
  if(turn)for(let i=0;i<=6;i++){const t=i/6,a=(1-t)*(1-t),b=2*(1-t)*t,c=t*t;pts.push([a*pin[0]+b*q[0]+c*pout[0],a*pin[1]+b*q[1]+c*pout[1]])}else pts.push(pin,pout);
  nodes.push({x:C[0],y:C[1],axis:Math.abs(d1[0])>.5?'ew':'ns',turn,i0,i1:pts.length-1});
 }
 const cum=[0];for(let i=1;i<=pts.length;i++){const a=pts[i-1],b=pts[i%pts.length];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]))}
 for(const nd of nodes){nd.enter=cum[nd.i0];nd.exit=cum[nd.i1]}
 return {pts,cum,len:cum[pts.length],nodes};
}
export const TRAFFIC_ROUTES=LOOPS.map(buildRoute);
export function trafficAt(progress,route=0){
 const R=TRAFFIC_ROUTES[route]||TRAFFIC_ROUTES[0],d=((progress%R.len)+R.len)%R.len,P=R.pts;let lo=0,hi=P.length-1;
 while(lo<hi){const mid=(lo+hi+1)>>1;if(R.cum[mid]<=d)lo=mid;else hi=mid-1}
 const a=P[lo],b=P[(lo+1)%P.length],f=(d-R.cum[lo])/((R.cum[lo+1]-R.cum[lo])||1);
 return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
const CAR_LEN={compact:58,sedan:68,suv:70,van:76};
const TRAFFIC_TYPES=['sedan','compact','suv','sedan','van','compact','sedan','suv'];
const TRAFFIC_PAINTS=['#f4f4f2','#1d3557','#a8adb3','#8b1e2b','#ffffff','#2f4f4f','#c9b28d','#111317','#5f8fb8','#7a1f1f','#d8d3c4','#3c5a78','#6b6f73','#b8862f','#e7e2d6','#4d2a3a'];
/** 16 cars: 4 each way round the outer loop and 2 on each block loop, evenly spaced, 31–42 km/h. */
export function spawnTraffic(){const out=[];[4,4,2,2,2,2].forEach((count,route)=>{const L=TRAFFIC_ROUTES[route].len;for(let k=0;k<count;k++){const i=out.length,cruise=130+(i*37)%46;
 out.push({route,progress:((k+.15+route*.13)/count%1)*L,speed:cruise*.6,cruise,type:TRAFFIC_TYPES[i%TRAFFIC_TYPES.length],paint:TRAFFIC_PAINTS[i%TRAFFIC_PAINTS.length],color:TRAFFIC_PAINTS[i%TRAFFIC_PAINTS.length]})}});
 // loops share lanes: nudge any car that would start on top of another one
 for(let i=0;i<out.length;i++)for(let tries=0;tries<12;tries++){const a=trafficAt(out[i].progress,out[i].route);if(!out.some((o,j)=>j<i&&Math.hypot(trafficAt(o.progress,o.route).x-a.x,trafficAt(o.progress,o.route).y-a.y)<110))break;out[i].progress=(out[i].progress+120)%TRAFFIC_ROUTES[out[i].route].len}
 return out}
/** Sidewalk walkers: position is a pure function of time (shared by the 2D and 3D views and the traffic). */
export function pedestrianAt(seed,t){const side=seed%2?1:-1;if(seed%3===0)return {x:roadX[seed%3]+side*75,y:160+((seed*113+t*(12+seed%9))%1500),angle:Math.PI/2};return {x:80+((seed*153+t*(10+seed%10))%2080),y:roadY[seed%3]+side*75,angle:0}}
function rounded(ctx,x,y,w,h,r=5){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function ink(ctx,text,x,y,size=12,color='#d7eee9',align='left',weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui,sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);}
function seedRandom(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

export class CityWorld {
 constructor(canvas,minimap,callbacks={}) {
  const {onChange=()=>{},onInteract=()=>{},onDiscover=()=>{}}=callbacks||{};
  this.canvas=canvas;this.minimap=minimap;this.ctx=canvas.getContext('2d');this.mapCtx=minimap?.getContext('2d');
  this.onChange=onChange;this.onInteract=onInteract;this.onDiscover=onDiscover;
  // optional feedback hooks (the app may also assign them later): onImpact(0..1), onHonk(), onWaypointReached()
  if(callbacks?.onImpact)this.onImpact=callbacks.onImpact;if(callbacks?.onHonk)this.onHonk=callbacks.onHonk;if(callbacks?.onWaypointReached)this.onWaypointReached=callbacks.onWaypointReached;
  this.config={paused:true,reducedMotion:false,completed:[],activeMission:'power',skin:'teal'};
  this.player={x:520,y:1050,inVehicle:false,speed:0,angle:-Math.PI/2};
  this.car={x:580,y:1025,angle:0};this.camera={x:520,y:1050};this.input={};this.walked=0;this.driven=0;
  this.time=0;this.last=0;this.notifyAt=0;this.bumpAt=-20;this.discovered=new Set();this.destroyed=false;
  this.secretPoints=ELEMENT_COINS.map(c=>({...c}));
  this.traffic=spawnTraffic();
  this.pedestrians=Array.from({length:30},(_,i)=>({x:0,y:0,seed:i,color:['#f3bd77','#7ad1be','#c3a2de','#d3e2d9'][i%4]}));
  this.surface=document.createElement('canvas');this.surface.width=WORLD.width;this.surface.height=WORLD.height;
  this.drawStatic();this.resize();this.resizeHandler=()=>this.resize();window.addEventListener('resize',this.resizeHandler);
  this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
 }
 resize(){
  const rect=this.canvas.getBoundingClientRect();this.width=rect.width||window.innerWidth;this.height=rect.height||window.innerHeight;this.dpr=Math.min(window.devicePixelRatio||1,2);
  this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
  this.zoom=this.width<620?.76:1;
  if(this.minimap){const r=this.minimap.getBoundingClientRect();this.mapWidth=r.width||180;this.mapHeight=r.height||135;this.minimap.width=this.mapWidth*this.dpr;this.minimap.height=this.mapHeight*this.dpr;}
 }
 updateConfig(config){
  const old=JSON.stringify(this.config.completed);Object.assign(this.config,config);
  if(old!==JSON.stringify(this.config.completed))this.drawStatic();
  if(config.paused)this.input={};
 }
 setInput(key,value){
  const map={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',Shift:'shift',' ':'handbrake'};
  this.input[map[key]||key.toLowerCase()]=value;
 }
 getState(){return {...this.player,walked:this.walked,driven:this.driven,car:{...this.car},discovered:[...this.discovered]};}
 loadPosition(p){
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!circleCollides(p.x,p.y,18)){
   this.player.x=p.x;this.player.y=p.y;this.player.angle=Number.isFinite(p.angle)?p.angle:0;
   this.player.inVehicle=Boolean(p.inVehicle);this.player.speed=0;
   if(p.car&&Number.isFinite(p.car.x)&&Number.isFinite(p.car.y)&&!circleCollides(p.car.x,p.car.y,18))Object.assign(this.car,p.car);
   if(p.inVehicle)Object.assign(this.car,{x:p.x,y:p.y,angle:this.player.angle});
   this.camera.x=p.x;this.camera.y=p.y;
  }
  this.walked=Number.isFinite(p?.walked)?p.walked:0;this.driven=Number.isFinite(p?.driven)?p.driven:0;
  this.discovered=new Set(Array.isArray(p?.discovered)?p.discovered:[]);
 }
 nearbyStation(){return stations.reduce((best,s)=>dist(s,this.player)<115&&(!best||dist(s,this.player)<dist(best,this.player))?s:best,null);}
 interact(){const s=this.nearbyStation();if(s){this.player.speed=0;this.onInteract(s.id);return true;}return false;}
 toggleVehicle(){
  if(this.player.inVehicle){
   this.car={x:this.player.x,y:this.player.y,angle:this.player.angle};
   const offsets=[Math.PI/2,-Math.PI/2,Math.PI,0];
   for(const o of offsets){let x=this.car.x+Math.cos(this.car.angle+o)*49,y=this.car.y+Math.sin(this.car.angle+o)*49;if(!circleCollides(x,y,14)){Object.assign(this.player,{x,y,inVehicle:false,speed:0});this.notify();return true;}}
   return false;
  }
  if(dist(this.car,this.player)<100){Object.assign(this.player,{x:this.car.x,y:this.car.y,angle:this.car.angle,inVehicle:true,speed:0});this.notify();return true;}
  return false;
 }
 recover(){Object.assign(this.player,{x:520,y:1050,inVehicle:false,speed:0,angle:-Math.PI/2});this.car={x:580,y:1025,angle:0};this.camera={x:520,y:1050};this.input={};this.notify();}
 district(){const p=this.player;if(p.x>1800)return 'Halogen Harbor';if(p.y>1000&&p.x<850)return 'Research Quarter';if(p.x<1000&&p.y<500)return 'Alkali Avenue';if(p.x>1100&&p.y<500)return 'Noble Gas Heights';if(p.x<400&&p.y<950)return 'Alkaline Heights';if(p.y>1000)return 'Metalloid Junction';return 'Transition Downtown';}
 notify(){this.onChange({...this.player,nearby:this.nearbyStation(),vehicleNearby:!this.player.inVehicle&&dist(this.player,this.car)<100,district:this.district(),walked:this.walked,driven:this.driven});}
 tick(dt){
  const p=this.player, before={x:p.x,y:p.y};
  if(p.inVehicle){
   const throttle=(this.input.up?1:0)-(this.input.down?1:0);
   if(throttle)p.speed+=throttle*220*dt;else p.speed*=Math.exp(-2.2*dt);
   if(this.input.space||this.input.handbrake)p.speed*=Math.exp(-8*dt);
   p.speed=clamp(p.speed,-135,355);if(Math.abs(p.speed)<2)p.speed=0;
   const steer=(this.input.right?1:0)-(this.input.left?1:0);
   if(Math.abs(p.speed)>4)p.angle+=steer*2.15*clamp(Math.abs(p.speed)/100,.25,1)*Math.sign(p.speed)*dt;
   const moved=moveWithCollisions(p.x,p.y,Math.cos(p.angle)*p.speed*dt,Math.sin(p.angle)*p.speed*dt,19);
   p.x=moved.x;p.y=moved.y;
   if(moved.hit){const k=collisionKeep(moved,Math.cos(p.angle)*p.speed,Math.sin(p.angle)*p.speed,19),impact=Math.abs(p.speed)*(1-k.keep);p.speed*=.25+.7*k.keep;if(impact>40&&this.time-this.bumpAt>.25){this.bumpAt=this.time;this.impact=Math.min(1,impact/260);this.onImpact?.(this.impact);}}
   Object.assign(this.car,{x:p.x,y:p.y,angle:p.angle});this.driven+=dist(p,before);
  }else{
   let dx=(this.input.right?1:0)-(this.input.left?1:0),dy=(this.input.down?1:0)-(this.input.up?1:0),len=Math.hypot(dx,dy);
   p.speed=len?(this.input.shift?230:165):0;
   if(len){dx/=len;dy/=len;p.angle=Math.atan2(dy,dx);const moved=moveWithCollisions(p.x,p.y,dx*p.speed*dt,dy*p.speed*dt,12);p.x=moved.x;p.y=moved.y;}
   this.walked+=dist(p,before);
  }
  this.advanceTraffic(dt);
  for(const secret of this.secretPoints)if(dist(secret,p)<COIN_PICKUP&&!this.discovered.has(secret.id)){this.discovered.add(secret.id);this.onDiscover(secret.id);}
  if(this.time-this.notifyAt>.12){this.notify();this.notifyAt=this.time;}
 }
 loop(timestamp){
  if(this.destroyed)return;this.frame=requestAnimationFrame(this.loop);try{this.frameBody(timestamp)}catch(err){const k=String(err);if(this.lastLoopError!==k){this.lastLoopError=k;console.error(err)}}}
 frameBody(timestamp){const dt=Math.min((timestamp-(this.last||timestamp))/1000,.04);this.last=timestamp;
  if(!this.config.paused){this.time+=dt;this.tick(dt);}
  const smooth=this.config.reducedMotion?1:1-Math.exp(-5*dt);
  const vw=this.width/this.zoom,vh=this.height/this.zoom;
  this.camera.x+=(clamp(this.player.x,vw/2,Math.max(vw/2,WORLD.width-vw/2))-this.camera.x)*smooth;
  this.camera.y+=(clamp(this.player.y,vh/2,Math.max(vh/2,WORLD.height-vh/2))-this.camera.y)*smooth;
  this.render();this.renderMap();
 }
 drawStatic(){
  const c=this.surface.getContext('2d');const rand=seedRandom(211);c.clearRect(0,0,2400,1800);c.fillStyle='#263f3d';c.fillRect(0,0,2400,1800);
  // Wide sidewalks form a completely connected, readable street network.
  for(const x of roadX){c.fillStyle='#596f70';c.fillRect(x-87,0,174,1800);c.fillStyle='#23343e';c.fillRect(x-60,0,120,1800);}
  for(const y of roadY){c.fillStyle='#596f70';c.fillRect(0,y-87,2400,174);c.fillStyle='#23343e';c.fillRect(0,y-60,2400,120);}
  // Fine surface detail remains stable across frames.
  for(let i=0;i<16000;i++){let x=rand()*2250,y=rand()*1800;c.fillStyle=rand()>.5?'#ffffff04':'#0000000b';c.fillRect(x,y,2,1);}
  c.strokeStyle='#cbbd7d88';c.lineWidth=2;c.setLineDash([18,18]);
  for(const x of roadX){c.beginPath();c.moveTo(x-3,50);c.lineTo(x-3,1770);c.stroke();c.beginPath();c.moveTo(x+3,50);c.lineTo(x+3,1770);c.stroke();}
  for(const y of roadY){c.beginPath();c.moveTo(30,y-3);c.lineTo(2250,y-3);c.stroke();c.beginPath();c.moveTo(30,y+3);c.lineTo(2250,y+3);c.stroke();}c.setLineDash([]);
  for(const x of roadX)for(const y of roadY){
   c.fillStyle='#23343e';c.fillRect(x-62,y-62,124,124);
   c.fillStyle='#c4d4ce';for(let n=-42;n<=42;n+=14){c.fillRect(x+n,y-76,7,23);c.fillRect(x+n,y+53,7,23);c.fillRect(x-76,y+n,23,7);c.fillRect(x+53,y+n,23,7);}
   const active=(this.config.completed||[]).includes('power');
   for(const [dx,dy] of [[-72,-72],[72,72]]){c.fillStyle='#172a31';rounded(c,x+dx-5,y+dy-11,10,22,3);c.fill();c.fillStyle=active?'#73e3b4':'#efb65c';c.beginPath();c.arc(x+dx,y+dy,3,0,Math.PI*2);c.fill();}
  }
  // Harbor edge, piers and molecular wave motifs.
  c.fillStyle='#163c49';c.fillRect(2265,0,135,1800);c.fillStyle='#73918a';c.fillRect(2247,0,18,1800);
  c.strokeStyle='#64c5ce30';c.lineWidth=2;
  for(let y=20;y<1800;y+=34){c.beginPath();for(let x=2280;x<=2400;x+=8){const py=y+Math.sin(x/18+y)*3;x===2280?c.moveTo(x,py):c.lineTo(x,py);}c.stroke();}
  for(const y of [460,900,1430]){c.fillStyle='#9b9681';c.fillRect(2250,y,105,24);c.strokeStyle='#575e55';for(let x=2253;x<2355;x+=10){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+24);c.stroke();}}
  // Neighborhood lawns, pocket parks, and footpaths.
  const parks=[{x:840,y:735,w:245,h:110},{x:1340,y:1310,w:200,h:110},{x:620,y:1290,w:180,h:90},{x:80,y:70,w:2100,h:24}];
  for(const p of parks){c.fillStyle='#3b6150';rounded(c,p.x,p.y,p.w,p.h,12);c.fill();c.strokeStyle='#8f9d7e';c.lineWidth=14;c.beginPath();c.moveTo(p.x+20,p.y+p.h/2);c.lineTo(p.x+p.w-20,p.y+p.h/2);c.stroke();}
  // Monument: periodic table tiles are art, not a replacement for the reference tool.
  for(let r=0;r<3;r++)for(let col=0;col<6;col++){c.fillStyle=['#57b7a0','#b5a2d6','#e5b26e'][r];c.fillRect(870+col*28,750+r*25,23,20);}
  for(const b of buildings)this.drawBuilding(c,b);
  // Road-name lettering and district banners.
  const labels=[['ALKALI AVENUE',730,410],['PERIODIC PARKWAY',1160,960],['RESEARCH LOOP',790,1510],['HALOGEN HARBOR',2110,1520]];
  for(const [s,x,y] of labels)ink(c,s,x,y,13,'#a7c0bd77','center',700);
  c.save();c.translate(1214,730);c.rotate(-Math.PI/2);ink(c,'TRANSITION BOULEVARD',0,0,13,'#a7c0bd77','center',700);c.restore();
  c.save();c.translate(1963,800);c.rotate(-Math.PI/2);ink(c,'HALOGEN HARBOR',0,0,13,'#a7c0bd77','center',700);c.restore();
  // Small street furniture, lamps, public art and trees, with open curbs at stations.
  for(let i=0;i<135;i++){
   let x=55+rand()*2150,y=100+rand()*1620;
   if(circleCollides(x,y,31)||roadX.some(v=>Math.abs(x-v)<100)||roadY.some(v=>Math.abs(y-v)<100)||stations.some(s=>dist(s,{x,y})<80))continue;
   this.drawTree(c,x,y,14+rand()*11);
  }
  for(const x of roadX)for(let y=180;y<1700;y+=245){
   if(roadY.some(v=>Math.abs(y-v)<95))continue;
   for(const dx of [-78,78]){c.fillStyle='#213b41';c.fillRect(x+dx-2,y-22,4,26);c.fillStyle='#f7d393';c.fillRect(x+dx-7,y-24,14,5);const g=c.createRadialGradient(x+dx,y,0,x+dx,y,44);g.addColorStop(0,'#ffd88b18');g.addColorStop(1,'#ffd88b00');c.fillStyle=g;c.fillRect(x+dx-44,y-44,88,88);}
  }
  // Fleet parking bay and headquarters arrival pad.
  c.strokeStyle='#a9c3b6';c.lineWidth=2;c.strokeRect(550,1005,65,40);ink(c,'CITY FLEET',584,1065,11,'#d4ddd1','center');
  c.fillStyle='#5b8478';rounded(c,350,1100,37,115,3);c.fill();ink(c,'01',369,1122,13,'#d5e5d7','center');
  // Progress changes are visible on the streets, not solely in menus.
  const done=this.config.completed||[];
  if(done.includes('identity')){for(let i=0;i<4;i++){c.fillStyle=['#e8bf77','#82c8bd','#b2a2dc','#95b4d3'][i];c.fillRect(2025,1160+i*30,28,24);ink(c,['Si','Ar','Al','Br'][i],2039,1177+i*30,12,'#1e343a','center');}}
  if(done.includes('family')){for(let i=0;i<4;i++){c.fillStyle=['#f6b465','#cdb6ff','#8fe0cb','#81d1e9'][i];c.fillRect(1255,310+i*25,35,18);ink(c,['1','2','17','18'][i],1272,323+i*25,11,'#193339','center');}}
  if(done.includes('reaction')){c.fillStyle='#75cdb3';rounded(c,365,280,35,40,4);c.fill();ink(c,'LAB',382,303,10,'#143330','center');}
  if(done.includes('ions')){c.strokeStyle='#73ddc4';c.lineWidth=4;c.beginPath();c.moveTo(2070,320);c.lineTo(2110,370);c.lineTo(2190,370);c.stroke();ink(c,'GRID ONLINE',2140,350,13,'#8fe9d0','center');}
  c.fillStyle='#122d33';c.fillRect(0,0,2400,45);ink(c,'ELEMENT CITY  /  STUDENT SCIENCE RESPONSE TEAM',70,30,15,'#96bbb4');ink(c,'NORTH CAMPUS · FUTURE EXPANSION',2090,30,12,'#9ab6b0','right');
 }
 drawBuilding(c,b){
  const h=b.height;c.fillStyle='#091b2555';c.beginPath();c.moveTo(b.x+8,b.y+10);c.lineTo(b.x+b.w+31,b.y+18);c.lineTo(b.x+b.w+31,b.y+b.h+22);c.lineTo(b.x+24,b.y+b.h+22);c.closePath();c.fill();
  c.fillStyle='#293f48';rounded(c,b.x,b.y,b.w,b.h,5);c.fill();
  c.fillStyle='#3c5560';c.fillRect(b.x+3,b.y+b.h-h,b.w-6,h);
  for(let x=b.x+14;x<b.x+b.w-12;x+=24){c.fillStyle=x%3?'#d6bc7880':'#78b3b180';c.fillRect(x,b.y+b.h-h+8,12,7);}
  c.fillStyle=b.hue;rounded(c,b.x,b.y-h,b.w,b.h,5);c.fill();c.strokeStyle='#b7cfbc33';c.lineWidth=2;c.stroke();
  c.fillStyle='#ffffff09';c.fillRect(b.x+7,b.y-h+7,b.w-14,4);
  c.strokeStyle='#263e4655';c.lineWidth=2;for(let x=b.x+20;x<b.x+b.w;x+=27){c.beginPath();c.moveTo(x,b.y-h+10);c.lineTo(x,b.y+b.h-h-10);c.stroke();}
  c.fillStyle='#293e4655';rounded(c,b.x+12,b.y-h+12,b.w-24,b.h-24,3);c.fill();
  // Rooftop HVACs, solar panels and a clean element monogram.
  c.fillStyle='#89a59a';c.fillRect(b.x+20,b.y-h+20,27,19);c.fillStyle='#28454e';c.fillRect(b.x+23,b.y-h+23,21,12);
  if(b.w>190){c.fillStyle='#294e5d';c.fillRect(b.x+b.w-62,b.y-h+20,42,32);c.strokeStyle='#87c3ca66';c.lineWidth=1;for(let z=0;z<4;z++){c.beginPath();c.moveTo(b.x+b.w-60+z*10,b.y-h+20);c.lineTo(b.x+b.w-60+z*10,b.y-h+52);c.stroke();}}
  ink(c,b.mark,b.x+b.w/2,b.y+b.h*.51-h,Math.min(b.w*.25,49),'#d8e4d3b0','center',300);
  ink(c,b.name,b.x+b.w/2,b.y+b.h-h-16,b.w<180?9:10,'#dde9df','center',800);
  c.fillStyle='#b4d1be';c.fillRect(b.x+b.w/2-12,b.y+b.h-10,24,10);
 }
 drawTree(c,x,y,r){c.fillStyle='#0b22234d';c.beginPath();c.ellipse(x+7,y+8,r,r*.7,0,0,Math.PI*2);c.fill();c.fillStyle='#344b3a';c.fillRect(x-3,y-3,6,14);c.fillStyle='#45715a';c.beginPath();c.arc(x,y-7,r,0,Math.PI*2);c.fill();c.fillStyle='#60836a';c.beginPath();c.arc(x-4,y-12,r*.7,0,Math.PI*2);c.fill();c.fillStyle='#89a07540';c.beginPath();c.arc(x-7,y-15,r*.33,0,Math.PI*2);c.fill();}
 drawCar(c,x,y,angle,color,player=false){
  c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#061a2355';rounded(c,-25,-12,52,30,7);c.fill();
  c.fillStyle='#132730';c.fillRect(-17,-17,10,6);c.fillRect(11,-17,10,6);c.fillRect(-17,11,10,6);c.fillRect(11,11,10,6);
  c.fillStyle=color;rounded(c,-25,-13,50,26,7);c.fill();c.fillStyle='#b4e1dc';c.fillRect(21,-9,3,6);c.fillRect(21,3,3,6);c.fillStyle='#f6ac76';c.fillRect(-25,-10,3,5);c.fillRect(-25,5,3,5);
  c.fillStyle='#173e4b';rounded(c,-10,-10,24,20,4);c.fill();c.fillStyle='#87c7ca';c.fillRect(10,-8,5,16);c.fillStyle='#aacdc055';c.fillRect(-8,-8,4,16);
  if(player){c.fillStyle='#f4e8be';c.fillRect(-5,-9,8,18);ink(c,'EC',0,3,7,'#1e514f','center',900);}
  c.restore();
 }
 drawPerson(c,x,y,angle,color,player=false){
  const bob=!this.config.reducedMotion&&this.player.speed&&!this.player.inVehicle&&player?Math.sin(this.time*14)*2:0;
  c.save();c.translate(x,y);c.rotate(angle+Math.PI/2);c.fillStyle='#0a222466';c.beginPath();c.ellipse(3,5,10,7,0,0,Math.PI*2);c.fill();
  c.fillStyle='#203b49';c.fillRect(-6,1+bob,5,10);c.fillRect(1,1-bob,5,10);c.fillStyle=color;rounded(c,-9,-8,18,16,5);c.fill();c.fillStyle='#dec09c';c.beginPath();c.arc(0,-9,6,0,Math.PI*2);c.fill();c.fillStyle='#213e42';c.beginPath();c.arc(0,-11,6,Math.PI,Math.PI*2);c.fill();
  if(player){c.fillStyle='#f3d891';c.fillRect(-4,-2,8,8);c.strokeStyle='#f7e8b3';c.lineWidth=2;c.beginPath();c.moveTo(-5,-13);c.lineTo(5,-13);c.stroke();}c.restore();
 }
 trafficPosition(progress,route=0){return trafficAt(progress,route)}
 /** Ambient traffic: each car follows its loop, keeps its distance from whatever is in its lane ahead
  * (cars, the investigator, parked cars, pedestrians), slows into turns, and once 'power' restores the
  * signals it stops at red and amber stop lines. Cars never move into the investigator; a car held up
  * by the investigator for 1.5 s calls onHonk (rate limited). Both the 2D and 3D worlds use this. */
 advanceTraffic(dt){
  const T=this.traffic;if(!T?.length||!(dt>0))return;const p=this.player,time=this.time||0,live=this.signalsLive??(this.config?.completed||[]).includes('power'),phase=signalPhase(time);
  for(const c of T){const q=trafficAt(c.progress,c.route||0);c.x=q.x;c.y=q.y;c.angle=q.angle;c.hx=Math.cos(q.angle);c.hy=Math.sin(q.angle);c.half=(CAR_LEN[c.type]||64)/2}
  const peds=(this.pedestrians||[]).map(s=>pedestrianAt(s.seed,time)),still=[...(this.parked||[])];
  if(!p.inVehicle&&Number.isFinite(this.car?.x))still.push(this.car);
  const extra=this.trafficBlockers?.()||[];
  // a looks at b: free distance ahead of a's bumper to b (Infinity when b is not in a's lane ahead)
  const ahead=(a,x,y,lat,size)=>{const dx=x-a.x,dy=y-a.y,al=dx*a.hx+dy*a.hy;if(al<=0||al>200)return Infinity;return Math.abs(dy*a.hx-dx*a.hy)<lat?al-a.half-size:Infinity};
  // (crossing cars are also checked where they will be in 0.7 s, so nobody noses into a moving stream)
  const sees=(a,b)=>{const dot=a.hx*b.hx+a.hy*b.hy;if(dot<-.6)return Infinity;if(dot>.6)return ahead(a,b.x,b.y,18,b.half);const t=.7*(b.speed||0);return Math.min(ahead(a,b.x,b.y,46,b.half),ahead(a,b.x+b.hx*t,b.y+b.hy*t,46,b.half))};
  for(let i=0;i<T.length;i++){const c=T[i],R=TRAFFIC_ROUTES[c.route||0]||TRAFFIC_ROUTES[0];if(!Number.isFinite(c.cruise))c.cruise=c.speed||0;const cruise=c.cruise;let gap=Infinity,waitOn=-1,byPlayer=false,hard=false;
   const ignore=(c.ignoreUntil||0)>time?c.ignore:-1;
   for(let j=0;j<T.length;j++){if(j===i)continue;const o=T[j];
    if((o.route||0)===(c.route||0)){const g=((o.progress-c.progress)%R.len+R.len)%R.len-c.half-o.half;if(g<250&&g<gap){gap=g;waitOn=j}continue} // same loop: exact distance along the path
    const g=sees(c,o);if(g===Infinity||j===ignore)continue;const back=sees(o,c);
    if(back!==Infinity&&(g<back||(g===back&&i<j)))continue; // both in each other's way: whoever is nearer the crossing goes first
    if(g<gap){gap=g;waitOn=j}}
   if(Number.isFinite(p.x)){const size=p.inVehicle?34:12,lat=p.inVehicle?30:24,dx=p.x-c.x,dy=p.y-c.y,al=dx*c.hx+dy*c.hy,g=ahead(c,p.x,p.y,lat,size);
    if(g<gap){gap=g;byPlayer=true;waitOn=-1}if(g!==Infinity&&al<c.half+size+10)hard=true}
   for(const o of still){const g=ahead(c,o.x,o.y,30,34);if(g<gap){gap=g;waitOn=-1}}
   for(const q of peds){const g=ahead(c,q.x,q.y,22,8);if(g<gap){gap=g;waitOn=-1}}
   for(const b of extra){const dx=b.x-c.x,dy=b.y-c.y,al=dx*c.hx+dy*c.hy;if(al>120&&al<260&&Math.abs(dy*c.hx-dx*c.hy)<(b.lat||70)){gap=Math.min(gap,al-150-c.half);waitOn=-1}}
   // intersections: slow into turns (and everywhere while the signals blink amber); stop at red/amber once signals work
   let cap=cruise;const v=Math.max(0,c.speed||0);
   for(const nd of R.nodes){const rel=((c.progress-nd.enter)%R.len+R.len)%R.len,inside=rel<nd.exit-nd.enter,dist=inside?0:R.len-rel,slow=nd.turn?Math.min(cruise,Math.max(60,cruise*.5)):!live?Math.min(cruise,Math.max(60,cruise*.6)):cruise;
    if(dist<260&&slow<cruise)cap=Math.min(cap,Math.sqrt(slow*slow+2*200*dist));
    if(live&&!inside&&dist<260){const light=phase[nd.axis];if(light!=='green'){const stop=dist-(STOP_LINE-CORNER)-c.half;const committed=light==='amber'?stop<v*v/520:stop<4&&v>30;if(!committed&&stop>-6&&stop<gap){gap=stop;waitOn=-1;byPlayer=false}}}}
   const target=Math.min(cap,gap<=6?0:Math.sqrt(2*220*(gap-6)));
   c.speed=hard?0:v<target?Math.min(target,v+90*dt):Math.max(target,v-460*dt);
   c.progress=(c.progress+c.speed*dt)%R.len;
   // honk (politely) at an investigator holding the car up; break rare cross-traffic standoffs
   if(byPlayer&&c.speed<5){c.wait=(c.wait||0)+dt;if(c.wait>1.5&&time-(c.honkAt??-99)>6&&time-(this.honkAt??-99)>2.5){c.honkAt=time;this.honkAt=time;this.onHonk?.()}}else c.wait=0;
   c.waitOn=c.speed<1?waitOn:-1;
  }
  // break the rare gridlock (a cycle of cars each waiting on the next): the lowest-numbered car goes first
  for(let i=0;i<T.length;i++){let j=T[i].waitOn,min=i,steps=0;while(j>=0&&j!==i&&steps++<T.length){min=Math.min(min,j);j=T[j].waitOn}if(j===i&&min===i){T[i].ignore=T[i].waitOn;T[i].ignoreUntil=time+1.5}}
 }
 render(){
  const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);
  c.save();c.translate(this.width/2,this.height/2);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);c.drawImage(this.surface,0,0);
  const isVisible=(x,y)=>Math.abs(x-this.camera.x)<this.width/this.zoom/2+80&&Math.abs(y-this.camera.y)<this.height/this.zoom/2+80;
  // Element coins not yet found (one per group).
  for(const s of this.secretPoints||[]){if(this.discovered.has(s.id)||!isVisible(s.x,s.y))continue;c.fillStyle='#e9c24f';c.strokeStyle='#5a4300';c.lineWidth=2;c.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;c.lineTo(s.x+Math.cos(a)*12,s.y+Math.sin(a)*12);}c.closePath();c.fill();c.stroke();ink(c,s.symbol||'?',s.x,s.y+4,s.symbol?.length>1?9:11,'#3a2c05','center',800);}
  // Ambient fleet traffic drives the street loops in both directions and yields to investigators.
  for(const t of this.traffic){const {x,y,angle}=Number.isFinite(t.x)?t:this.trafficPosition(t.progress,t.route||0);if(isVisible(x,y))this.drawCar(c,x,y,angle,t.color||'#a9b5ab');}
  for(const p of this.pedestrians){let {x,y,angle:ang}=pedestrianAt(p.seed,this.time);
   const d=dist({x,y},this.player);if(d<68){x+=(x-this.player.x)/(d||1)*(68-d);y+=(y-this.player.y)/(d||1)*(68-d);}if(isVisible(x,y)&&!circleCollides(x,y,7))this.drawPerson(c,x,y,ang,p.color);
  }
  const skin=this.config.skin==='amber'?'#e9b065':this.config.skin==='violet'?'#ad9cde':'#6fc8b4';
  if(!this.player.inVehicle){this.drawCar(c,this.car.x,this.car.y,this.car.angle,skin,true);if(dist(this.player,this.car)<100){c.fillStyle='#102c34e6';rounded(c,this.car.x-41,this.car.y-45,82,23,5);c.fill();ink(c,'E · BORROW',this.car.x,this.car.y-29,10,'#e8f4ec','center',700);}}
  if(this.player.inVehicle)this.drawCar(c,this.player.x,this.player.y,this.player.angle,skin,true);else this.drawPerson(c,this.player.x,this.player.y,this.player.angle,'#73dbc3',true);
  // Mission beacons: number and silhouette remain legible without color.
  for(const s of stations){if(!isVisible(s.x,s.y))continue;const done=this.config.completed.includes(s.id),active=this.config.activeMission===s.id,near=dist(s,this.player)<115;
   const radius=active?27:18;c.strokeStyle=done?'#86b9a7':s.color;c.lineWidth=active?3:1.5;c.setLineDash(done?[]:[5,6]);c.beginPath();c.ellipse(s.x,s.y,radius,radius*.55,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
   const bob=this.config.reducedMotion?0:Math.sin(this.time*2+s.x)*3;
   c.fillStyle='#102b35ee';rounded(c,s.x-18,s.y-64+bob,36,29,8);c.fill();c.strokeStyle=active?s.color:'#87aaa655';c.stroke();ink(c,done?'✓':s.code,s.x,s.y-44+bob,13,s.color,'center',800);
   if(active||near){const text=near?'F · INVESTIGATE':s.name;const width=Math.max(98,text.length*6.7);c.fillStyle='#102b35ed';rounded(c,s.x-width/2,s.y+30,width,24,6);c.fill();ink(c,text,s.x,s.y+46,11,'#edf5ed','center',700);}
  }
  if(this.time-this.bumpAt<.4&&!this.config.reducedMotion){c.strokeStyle='#f5ca7a';c.lineWidth=2;for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=22+(this.time-this.bumpAt)*40;c.beginPath();c.moveTo(this.player.x+Math.cos(a)*r,this.player.y+Math.sin(a)*r);c.lineTo(this.player.x+Math.cos(a)*(r+7),this.player.y+Math.sin(a)*(r+7));c.stroke();}}
  c.restore();
  // Gentle edge shading sets a dusk atmosphere without obscuring play.
  const vignette=c.createRadialGradient(this.width/2,this.height/2,this.width*.2,this.width/2,this.height/2,Math.max(this.width,this.height)*.72);vignette.addColorStop(0,'#071a2500');vignette.addColorStop(1,'#071a2545');c.fillStyle=vignette;c.fillRect(0,0,this.width,this.height);
  const target=stations.find(s=>s.id===this.config.activeMission);if(target){const sx=(target.x-this.camera.x)*this.zoom+this.width/2,sy=(target.y-this.camera.y)*this.zoom+this.height/2;if(sx<35||sx>this.width-35||sy<120||sy>this.height-80){const x=clamp(sx,30,this.width-30),y=clamp(sy,120,this.height-110),a=Math.atan2(sy-y,sx-x);c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#ffd08b';c.beginPath();c.moveTo(12,0);c.lineTo(-8,-8);c.lineTo(-4,0);c.lineTo(-8,8);c.closePath();c.fill();c.restore();}}
 }
 renderMap(){
  if(!this.mapCtx)return;const c=this.mapCtx,w=this.mapWidth,h=this.mapHeight;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);c.fillStyle='#19323a';c.fillRect(0,0,w,h);
  const sx=w/WORLD.width,sy=h/WORLD.height;c.save();c.scale(sx,sy);c.fillStyle='#355258';for(const x of roadX)c.fillRect(x-60,0,120,1800);for(const y of roadY)c.fillRect(0,y-60,2400,120);c.fillStyle='#617c78';for(const b of buildings)c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#265b67';c.fillRect(2265,0,135,1800);
  for(const s of stations){c.fillStyle=this.config.completed.includes(s.id)?'#85b7a5':s.id===this.config.activeMission?'#ffd28b':'#789a9a';c.beginPath();c.arc(s.x,s.y,s.id===this.config.activeMission?43:24,0,Math.PI*2);c.fill();}
  c.strokeStyle='#b4d6ce44';c.lineWidth=9;c.strokeRect(this.camera.x-this.width/this.zoom/2,this.camera.y-this.height/this.zoom/2,this.width/this.zoom,this.height/this.zoom);
  c.translate(this.player.x,this.player.y);c.rotate(this.player.angle);c.fillStyle='#f4fcf2';c.strokeStyle='#14353f';c.lineWidth=9;c.beginPath();c.moveTo(58,0);c.lineTo(-36,-32);c.lineTo(-20,0);c.lineTo(-36,32);c.closePath();c.fill();c.stroke();c.restore();
  ink(c,'N',w-10,14,10,'#b6cdc5','center',800);
 }
 /** 3D-only lighting hooks (time of day, city lights); the 2D fallback ignores them. */
 setTimeMode(mode){return mode}
 setCityProgress(){}
 /** 3D-only GPS waypoint; the 2D fallback has no route ribbon, so these are no-ops. */
 setWaypoint(){return null}
 clearWaypoint(){return false}
 get waypoint(){return null}
 destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);window.removeEventListener('resize',this.resizeHandler);}
}
