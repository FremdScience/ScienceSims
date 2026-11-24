/** Element City v5 procedural 3D assets. Everything is generated in code at load time:
 * no downloaded models, photos, fonts or textures. All art is original. */
import * as THREE from './vendor/three.module.js';

export const M = 15;            // world units per metre (visual scale)
export const FLOOR = 51;        // storey height (≈3.4 m)
export const GROUND = 72;       // ground-floor storefront height (≈4.8 m)
export const BAY = 60;          // facade bay width (≈4 m)
export const CURB = 2;          // sidewalk / plaza height above the road surface

export function rng(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Canvas texture helper. `srgb` for colour maps; false for data maps (roughness/metalness). */
export function canvasTexture(w,h,draw,{repeat=false,srgb=true}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;
  if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping}
  t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return t;
}
function speckle(c,w,h,n,seed,light='#ffffff',dark='#000000',alpha=.05){const r=rng(seed);c.globalAlpha=alpha;for(let i=0;i<n;i++){c.fillStyle=r()>.5?light:dark;const s=1+r()*2.2;c.fillRect(r()*w,r()*h,s,s)}c.globalAlpha=1}

/** Merge many (possibly indexed) geometries into one non-indexed geometry. */
export function mergeGeometries(list){
  const parts=list.map(g=>g.index?g.toNonIndexed():g);let total=0;for(const p of parts)total+=p.attributes.position.count;
  const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2);
  const hasColor=parts.some(p=>p.attributes.color),col=hasColor?new Float32Array(total*3):null;let o=0;
  for(const p of parts){const n=p.attributes.position.count;pos.set(p.attributes.position.array,o*3);
    if(p.attributes.normal)nor.set(p.attributes.normal.array,o*3);if(p.attributes.uv)uv.set(p.attributes.uv.array,o*2);
    if(col){if(p.attributes.color)col.set(p.attributes.color.array,o*3);else col.fill(1,o*3,(o+n)*3)}o+=n}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeBoundingSphere();g.computeBoundingBox();
  for(const p of parts)p.dispose?.();return g;
}
export function tint(g,color){const c=new THREE.Color(color),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}

/** Collects geometry by material, then emits one mesh per material (few draw calls). */
export class Batch{
  constructor(){this.map=new Map()}
  add(material,geometry){if(!this.map.has(material))this.map.set(material,[]);this.map.get(material).push(geometry);return geometry}
  box(material,w,h,d,x,y,z,{color,ry=0}={}){const g=new THREE.BoxGeometry(w,h,d);if(ry)g.rotateY(ry);g.translate(x,y,z);if(color)tint(g,color);return this.add(material,g)}
  build(parent,{cast=true,receive=true}={}){const meshes=[];for(const [mat,list] of this.map){if(!list.length)continue;const m=new THREE.Mesh(mergeGeometries(list),mat);m.castShadow=cast;m.receiveShadow=receive;m.matrixAutoUpdate=false;m.updateMatrix();parent.add(m);meshes.push(m)}this.map.clear();return meshes}
}

/** Box with UVs measured in world units (u along the face, v up), for tiling facades. */
export function facadeBox(w,h,d,uScale,vScale){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
  for(let f=0;f<6;f++){const horiz=f<2?d:w,vert=(f===2||f===3)?d:h;for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*horiz/uScale,uv.getY(i)*vert/vScale)}}
  return g;
}
/** Split a BoxGeometry into side faces (+x,-x,+z,-z) and the top face. */
export function splitBox(g){
  const idx=g.index.array,take=faces=>{const out=new THREE.BufferGeometry(),pos=[],nor=[],uv=[];const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;
    for(const f of faces)for(let t=f*6;t<f*6+6;t++){const i=idx[t];pos.push(P.getX(i),P.getY(i),P.getZ(i));nor.push(N.getX(i),N.getY(i),N.getZ(i));uv.push(U.getX(i),U.getY(i))}
    out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return out};
  const r={sides:take([0,1,4,5]),top:take([2])};g.dispose();return r;
}

// ---------------------------------------------------------------- surface textures
export function asphaltTexture(){return canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#4a4d50';c.fillRect(0,0,w,h);speckle(c,w,h,9000,11,'#9a9a96','#1c1d1f',.16);
  const r=rng(5);c.globalAlpha=.07;for(let i=0;i<12;i++){c.fillStyle=r()>.5?'#2a2c2e':'#6a6a66';c.beginPath();c.ellipse(r()*w,r()*h,8+r()*30,4+r()*16,r()*3,0,7);c.fill()}c.globalAlpha=1;
  c.strokeStyle='#2b2d2f88';c.lineWidth=1;c.beginPath();c.moveTo(r()*w,0);for(let y=0;y<h;y+=16)c.lineTo(r()*w*.2+w*.4,y);c.stroke()},{repeat:true})}
export function paverTexture(){return canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#c9c2b3';c.fillRect(0,0,w,h);const r=rng(19);
  for(let y=0;y<h;y+=64)for(let x=0;x<w;x+=64){const v=Math.floor(196+r()*22);c.fillStyle=`rgb(${v},${v-6},${v-18})`;c.fillRect(x+1,y+1,62,62)}
  speckle(c,w,h,5000,23,'#ffffff','#5c564c',.08);c.fillStyle='#8f887a';for(let i=0;i<=w;i+=64){c.fillRect(i-1,0,2,h);c.fillRect(0,i-1,w,2)}},{repeat:true})}
export function grassTexture(){return canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#5f7f3f';c.fillRect(0,0,w,h);const r=rng(41);for(let i=0;i<7000;i++){c.fillStyle=['#6f9147','#557335','#7a9a4f','#4c6a2f'][i%4];c.fillRect(r()*w,r()*h,1,2+r()*3)}},{repeat:true})}
export function roofTexture(){return canvasTexture(128,128,(c,w,h)=>{c.fillStyle='#8a8b86';c.fillRect(0,0,w,h);speckle(c,w,h,3000,77,'#c8c8c0','#4a4b48',.2);c.strokeStyle='#6d6e6a';c.lineWidth=2;for(let i=0;i<w;i+=32){c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke()}},{repeat:true})}
export function chevronTexture(){const t=canvasTexture(64,64,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='rgba(255,255,255,.28)';c.fillRect(0,4,w,h-8);c.fillStyle='#ffffff';c.beginPath();c.moveTo(6,6);c.lineTo(40,32);c.lineTo(6,58);c.lineTo(22,58);c.lineTo(56,32);c.lineTo(22,6);c.closePath();c.fill()},{repeat:true});return t}

// ---------------------------------------------------------------- facade styles
/* Each facade texture is 4 bays × 4 storeys. Walls are near-white so per-building vertex
 * colours tint them. A companion data texture packs roughness (G) and metalness (B). */
export const STYLES=['glass','deco','brick','concrete'];
function drawFacade(c,orm,style,w,h,em){
  const r=rng(style.length*97+13),bw=w/4,fh=h/4;if(em){em.fillStyle='#000';em.fillRect(0,0,w,h)}
  const wall={glass:'#d9e2e4',deco:'#f6f1e6',brick:'#ffffff',concrete:'#e7e4de'}[style];
  c.fillStyle=wall;c.fillRect(0,0,w,h);orm.fillStyle='rgb(255,235,0)';orm.fillRect(0,0,w,h);
  if(style==='brick'){c.fillStyle='#b8664c';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=8)for(let x=(y/8)%2*8;x<w;x+=16){const v=r();c.fillStyle=v>.7?'#a5583f':v>.4?'#c27153':'#b36148';c.fillRect(x,y,15,7)}c.fillStyle='#d8c9b5';for(let y=7;y<h;y+=8)c.fillRect(0,y,w,1)}
  if(style==='concrete')speckle(c,w,h,4000,3,'#ffffff','#8a867c',.12);
  if(style==='deco'){speckle(c,w,h,2500,8,'#ffffff','#b9b2a2',.07)}
  for(let fl=0;fl<4;fl++)for(let b=0;b<4;b++){
    let x,y,ww,hh;
    if(style==='glass'){x=b*bw+3;ww=bw-6;y=fl*fh+5;hh=fh-12}
    else if(style==='deco'){x=b*bw+bw*.12;ww=bw*.76;y=fl*fh+fh*.22;hh=fh*.56}
    else if(style==='brick'){x=b*bw+bw*.24;ww=bw*.52;y=fl*fh+fh*.18;hh=fh*.6}
    else {x=b*bw+bw*.1;ww=bw*.8;y=fl*fh+fh*.16;hh=fh*.62}
    // glass: vertical gradient suggests reflected sky; random blinds and the odd warm light
    const g=c.createLinearGradient(0,y,0,y+hh);const tintTop=style==='glass'?'#7fb3c9':'#8eb0c4',tintBot=style==='glass'?'#24485c':'#2c3d4a';
    g.addColorStop(0,tintTop);g.addColorStop(.55,'#3d6a80');g.addColorStop(1,tintBot);c.fillStyle=g;c.fillRect(x,y,ww,hh);
    const blind=r();if(blind>.55){c.fillStyle=blind>.85?'#e9e1cf':'#c9c2b2';c.globalAlpha=.75;c.fillRect(x,y,ww,hh*(.2+r()*.5));c.globalAlpha=1}
    if(r()>.9){c.fillStyle='#f3d79a';c.globalAlpha=.55;c.fillRect(x+2,y+hh*.55,ww-4,hh*.4);c.globalAlpha=1}
    c.fillStyle=style==='glass'?'#1d2b33':'#f4f1ea';const frame=style==='glass'?2:3;
    c.fillRect(x+ww/2-1,y,2,hh);if(style!=='glass'){c.fillRect(x-frame,y-frame,ww+frame*2,frame);c.fillRect(x-frame,y+hh,ww+frame*2,frame+2);c.fillRect(x-frame,y,frame,hh);c.fillRect(x+ww,y,frame,hh)}
    orm.fillStyle=style==='glass'?'rgb(255,18,170)':'rgb(255,30,110)';orm.fillRect(x,y,ww,hh);
    if(em){em.fillStyle='#fff';em.fillRect(x+2,y+2,ww-4,hh-4)}
  }
  if(style==='glass'){c.fillStyle='#2b3a42';for(let fl=0;fl<4;fl++)c.fillRect(0,fl*fh+fh-7,w,7);c.fillStyle='#1d2b33';for(let b=0;b<=4;b++)c.fillRect(b*bw-3,0,6,h)}
  if(style==='deco'){c.fillStyle='#00000018';for(let fl=0;fl<4;fl++)c.fillRect(0,fl*fh+fh*.2-6,w,5)}
}
/** Night lighting shared by every facade: uLit is the share of windows lit (0..1). */
export const CITY_LIGHTS={uLit:{value:.35}};
/** Lit windows at night: the emissive map is a window mask; each window cell (UV grid) gets a hashed
 * on/off rank and a warm or cool tint, so the pattern never repeats between buildings. */
function windowGlow(shader){shader.uniforms.uLit=CITY_LIGHTS.uLit;
  shader.fragmentShader=shader.fragmentShader.replace('void main() {','uniform float uLit;\nvoid main() {').replace('#include <emissivemap_fragment>',
   '#ifdef USE_EMISSIVEMAP\n{vec2 cell=floor(vEmissiveMapUv*4.);float r1=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453),r2=fract(sin(dot(cell,vec2(39.346,11.135)))*24634.6345);'+
   'totalEmissiveRadiance*=texture2D(emissiveMap,vEmissiveMapUv).r*step(r1,uLit)*(.55+.45*r2)*mix(vec3(1.,.74,.42),vec3(.78,.87,1.),step(.8,r2));}\n#endif')}
export function facadeMaterials(envIntensity=1){
  const out={};
  for(const style of STYLES){let ormCtx,emCtx;
    const ormTex=canvasTexture(512,512,(c)=>{ormCtx=c},{repeat:true,srgb:false}),emTex=canvasTexture(512,512,(c)=>{emCtx=c},{repeat:true,srgb:false});
    const map=canvasTexture(512,512,(c,w,h)=>drawFacade(c,ormCtx,style,w,h,emCtx),{repeat:true});ormTex.needsUpdate=true;emTex.needsUpdate=true;
    out[style]=new THREE.MeshStandardMaterial({map,roughnessMap:ormTex,metalnessMap:ormTex,roughness:1,metalness:1,vertexColors:true,envMapIntensity:envIntensity,emissive:'#ffffff',emissiveMap:emTex,emissiveIntensity:0});
    out[style].onBeforeCompile=windowGlow;
  }
  return out;
}
export function storefrontMaterial(){let ormCtx,emCtx;const orm=canvasTexture(512,256,c=>{ormCtx=c},{repeat:true,srgb:false}),em=canvasTexture(512,256,c=>{emCtx=c},{repeat:true});
  const map=canvasTexture(512,256,(c,w,h)=>{const r=rng(301);c.fillStyle='#e8e4dc';c.fillRect(0,0,w,h);ormCtx.fillStyle='rgb(255,220,0)';ormCtx.fillRect(0,0,w,h);
    c.fillStyle='#2a2f33';c.fillRect(0,0,w,46);ormCtx.fillStyle='rgb(255,120,40)';ormCtx.fillRect(0,0,w,46);emCtx.fillStyle='#000';emCtx.fillRect(0,0,w,h);
    for(let b=0;b<4;b++){const x=b*128+8;c.fillStyle='#30363a';c.fillRect(x-4,52,120,h-52);const g=c.createLinearGradient(0,56,0,h);g.addColorStop(0,'#9cc3d3');g.addColorStop(.5,'#557d90');g.addColorStop(1,'#2a4250');c.fillStyle=g;
      c.fillRect(x,58,112,h-62);ormCtx.fillStyle='rgb(255,14,140)';ormCtx.fillRect(x,58,112,h-62);
      const eg=emCtx.createLinearGradient(0,58,0,h);eg.addColorStop(0,'#5a4128');eg.addColorStop(1,['#ffd49a','#ffe6bf','#ffc98a','#e8f0ff'][b]);emCtx.fillStyle=eg;emCtx.fillRect(x,58,112,h-62);
      c.globalAlpha=.35;c.fillStyle=['#e6c68f','#c9e0d6','#e3b4a6','#d7d0f0'][Math.floor(r()*4)];c.fillRect(x+6,h-70,100,60);c.globalAlpha=1;
      c.fillStyle='#30363a';c.fillRect(x+55,58,3,h-62);if(b%2){c.fillStyle='#3b4a52';c.fillRect(x+70,120,36,h-120);c.fillStyle='#c9b27a';c.fillRect(x+98,180,3,12)}}
  },{repeat:true});orm.needsUpdate=true;em.needsUpdate=true;
  return new THREE.MeshStandardMaterial({map,roughnessMap:orm,metalnessMap:orm,roughness:1,metalness:1,vertexColors:true,emissive:'#ffffff',emissiveMap:em,emissiveIntensity:0});
}

/** Text atlas: one canvas, many labelled slots. Returns {texture, uv(slot)}. */
export function textAtlas(entries,{cols=2,slotW=512,slotH=64,draw}){
  const rows=Math.ceil(entries.length/cols),W=cols*slotW,H=Math.max(64,rows*slotH);
  const tex=canvasTexture(W,H,(c)=>{entries.forEach((e,i)=>{const x=(i%cols)*slotW,y=Math.floor(i/cols)*slotH;c.save();c.translate(x,y);draw(c,e,slotW,slotH,i);c.restore()})});
  tex.anisotropy=4;
  const uv=i=>{const x=(i%cols)*slotW,y=Math.floor(i/cols)*slotH;return {u0:x/W,u1:(x+slotW)/W,v0:1-(y+slotH)/H,v1:1-y/H}};
  return {texture:tex,uv};
}
/** A vertical quad with atlas UVs, centred at (x,y,z), facing +z then rotated by ry. */
export function signQuad(w,h,x,y,z,ry,slot){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)?slot.u1:slot.u0,uv.getY(i)?slot.v1:slot.v0);g.rotateY(ry);g.translate(x,y,z);return g}

// ---------------------------------------------------------------- vehicles
export const VEHICLES={
  compact:{L:58,W:27,body:[[-29,4],[29,4],[29.6,8.6],[27.4,11.4],[12.6,13.2],[-26.6,13.8],[-29.2,10.4]],cabin:[[13,13],[4.6,20.8],[-20.4,21.2],[-26.4,13.8]],wx:18.5,r:5.3},
  sedan:{L:68,W:28,body:[[-34,4],[34,4],[34.6,8.4],[32,11],[16,12.6],[-27,13],[-33,12.6],[-34.4,9]],cabin:[[15.6,12.6],[6,19.8],[-14,20.1],[-24.6,13]],wx:22,r:5.2},
  suv:{L:70,W:30,body:[[-35,5.5],[35,5.5],[35.6,12],[33,15],[18,16.6],[-34,17.2],[-35.4,13]],cabin:[[17.5,16.6],[9,26],[-31,26.6],[-34,17.2]],wx:23,r:6.4},
  van:{L:76,W:31,body:[[-38,5],[38,5],[38.6,13],[35.5,17.5],[27,19.5],[-37.6,20],[-38.2,12]],cabin:[[26.8,19.5],[19,30],[-36.5,31],[-37.6,20]],wx:26,r:6},
  // sports sedan in the style of a 2019 Audi S6: long hood, low roof, big single-frame grille, quad exhaust (no badges)
  s6:{L:70,W:28.6,body:[[-35,4],[35,4],[35.6,8.2],[33.4,10.9],[15,12.3],[-27,12.7],[-33.6,12.1],[-35.4,8.4]],cabin:[[15,12.3],[5.2,19],[-12.5,19.3],[-26,12.7]],wx:22.4,r:5.5},
  // rear-engine track coupe in the style of a Porsche 911 GT2 RS: low and wide, sloping fastback, big rear wing (no badges)
  gt2:{L:64,W:30,body:[[-32,4],[32,4],[32.6,7.2],[29.6,9.2],[9.5,12],[-23,12.4],[-30.6,11.8],[-32.4,8.4]],cabin:[[9.5,12],[1.5,16.8],[-8.5,17],[-23.5,12.4]],wx:20.5,r:5.6}
};
const shared={};
function sharedMats(){if(shared.glass)return shared;
  shared.glass=new THREE.MeshStandardMaterial({color:'#1c2b33',metalness:.3,roughness:.08,envMapIntensity:1.6});
  shared.tire=new THREE.MeshStandardMaterial({color:'#161616',roughness:.92});
  shared.rim=new THREE.MeshStandardMaterial({color:'#c2c6ca',metalness:.95,roughness:.22});
  shared.trim=new THREE.MeshStandardMaterial({color:'#1b1e20',roughness:.6});
  shared.head=new THREE.MeshStandardMaterial({color:'#fff7e0',emissive:'#fff1c4',emissiveIntensity:.7,roughness:.2});
  shared.tail=new THREE.MeshStandardMaterial({color:'#5a0a08',emissive:'#ff2a14',emissiveIntensity:.35,roughness:.3});
  shared.reverse=new THREE.MeshStandardMaterial({color:'#d9dcdf',emissive:'#ffffff',emissiveIntensity:0,roughness:.2});
  return shared}
/** Shared vehicle light materials (head, tail), so night lighting can raise them in one place. */
export function vehicleLights(){return sharedMats()}
function extrude(points,depth,bevel){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.8,bevelSegments:2,curveSegments:4,steps:1});g.translate(0,0,-depth/2);return g}
/** Details that make the two sports cars read at a glance (original shapes; no badges or logos).
 * fx/bx = the body's real front and rear (its rounded edge sticks out past the outline). */
function sportParts(type,v,add,m,fx,bx){const dark=sportParts.dark||(sportParts.dark=new THREE.MeshStandardMaterial({color:'#15181c',metalness:.5,roughness:.3})),
  metal=sportParts.metal||(sportParts.metal=new THREE.MeshStandardMaterial({color:'#b9bec4',metalness:.95,roughness:.2})),box=(w,h,d,x,y,z,mat)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);add(g,mat,false)};
  const W=v.W;
  if(type==='s6'){box(.5,6.2,W*.52,fx+.15,7.2,0,metal);box(.6,5.4,W*.47,fx+.35,7.2,0,dark);                       // single-frame grille: silver frame, dark mesh
    for(let k=0;k<4;k++)box(.2,.3,W*.44,fx+.7,5.3+k*1.25,0,metal);                                                  // grille slats
    for(const z of [-1,1]){box(.8,1.1,6.4,fx-.1,9,z*(W/2-4.6),m.head);                                              // slim LED headlights
      box(.6,2.2,3.8,fx+.1,5,z*(W/2-3.4),dark);                                                                      // lower intakes
      for(const k of [0,1]){const t=new THREE.CylinderGeometry(.9,.9,1.6,12);t.rotateZ(Math.PI/2);t.translate(bx-.5,4.6,z*(4.6+k*2.6));add(t,metal,false)}}   // quad exhaust
    box(.6,.5,W-6,fx+.1,3.8,0,dark)}                                                                                 // front lip
  if(type==='gt2'){for(const z of [-1,1]){const h=new THREE.SphereGeometry(2.3,16,10);h.scale(1.15,.8,1);h.translate(28.6,10.3,z*(W/2-5.4));add(h,m.head,false);   // round headlights
      box(5,.4,2.2,19,11.4,z*3.6,dark);                                                                             // hood ducts
      box(5.5,3,.6,-12,9.6,z*(W/2-.15),dark);                                                                       // side intakes
      box(1.4,6.4,.9,-28.2,15.6,z*6.5,dark);box(6.6,3.4,.6,-29,19,z*(W/2-.9),dark);                                // wing struts and end plates
      box(1,1.6,6,fx-.2,6,z*(W/2-6),dark);                                                                          // front intakes
      const t=new THREE.CylinderGeometry(1.05,1.05,1.6,12);t.rotateZ(Math.PI/2);t.translate(bx-.5,5.6,z*2.6);add(t,metal,false)}  // centre exhausts
    box(6.4,.9,W-1.2,-29,19.4,0,dark);                                                                                // rear wing
    box(3.4,.8,W-1,fx-1.2,3.6,0,dark);box(2.6,2.2,W-7,bx+.9,3.9,0,dark)}}                                            // splitter and diffuser
/** Vehicle facing +x, wheels on the ground (y=0). Returns a Group with userData for animation. */
export function makeVehicle(type='sedan',{paint='#c8ccd0',fleet=false,stripe='#14a38f',ownTail=false}={}){
  const v=VEHICLES[type]||VEHICLES.sedan,m=sharedMats(),g=new THREE.Group();
  const paintMat=new THREE.MeshStandardMaterial({color:paint,metalness:.55,roughness:.32,envMapIntensity:1.25});
  const add=(geo,mat,cast=true)=>{const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=cast;mesh.receiveShadow=false;g.add(mesh);return mesh};
  const bodyGeo=extrude(v.body,v.W-3.2,1.6);bodyGeo.computeBoundingBox();const fx=bodyGeo.boundingBox.max.x,bx=bodyGeo.boundingBox.min.x;add(bodyGeo,paintMat);
  add(extrude(v.cabin,v.W-7,1.2),m.glass);
  const top=Math.max(...v.cabin.map(p=>p[1])),front=v.cabin[1][0],rear=v.cabin[2][0];
  const roof=new THREE.BoxGeometry(front-rear-1.5,1.2,v.W-5.4);roof.translate((front+rear)/2,top+.3,0);add(roof,paintMat);
  const pillar=new THREE.BoxGeometry(1.8,top-v.cabin[0][1],v.W-5.6);pillar.translate(rear+(front-rear)*.42,(top+v.cabin[0][1])/2,0);add(pillar,paintMat);
  const bumperF=new THREE.BoxGeometry(2.4,3.4,v.W-2);bumperF.translate(v.L/2+.2,5.6,0);add(bumperF,m.trim);
  const bumperR=bumperF.clone();bumperR.translate(-v.L-.4,0,0);add(bumperR,m.trim);
  const rocker=new THREE.BoxGeometry(v.L-2*v.r-14,2.6,v.W-1.2);rocker.translate(0,4.6,0);add(rocker,m.trim,false);
  const sport=type==='s6'||type==='gt2';
  if(!sport){const grill=new THREE.BoxGeometry(1,2.6,v.W*.45);grill.translate(v.L/2+.6,9.2,0);add(grill,m.trim,false)}
  const tailMat=ownTail?m.tail.clone():m.tail,reverseMat=ownTail?m.reverse.clone():m.reverse,rx=v.body.at(-1)[0]+.2,ry=v.body.at(-1)[1];
  // full-width rear light bar, reverse lamps and wheel arches (the view players see most)
  const bar=new THREE.BoxGeometry(1,1,v.W-9);bar.translate(rx,ry+1.2,0);add(bar,tailMat,false);
  for(const z of [-1,1]){if(!sport){const h=new THREE.BoxGeometry(1.2,2.2,5.4);h.translate(v.body[2][0]-.6,v.body[2][1]+.6,z*(v.W/2-4.6));add(h,m.head,false)}
    const t=new THREE.BoxGeometry(1.2,2.4,5.8);t.translate(v.body.at(-1)[0]+.2,v.body.at(-1)[1]+1.2,z*(v.W/2-4.4));add(t,tailMat,false);
    const mirror=new THREE.BoxGeometry(2.4,1.6,2.2);mirror.translate(front-2,v.cabin[0][1]+1.4,z*(v.W/2+.6));add(mirror,paintMat,false);
    const rev=new THREE.BoxGeometry(1,1.3,2.8);rev.translate(rx-.6,ry-1.6,z*(v.W/2-9.5));add(rev,reverseMat,false);
    for(const ax of [-v.wx,v.wx]){const arch=new THREE.TorusGeometry(v.r+1.1,1.1,4,10,Math.PI);arch.translate(ax,v.r,z*(v.W/2-.5));add(arch,m.trim,false)}}
  g.userData.wheels=[];
  const tireGeo=new THREE.CylinderGeometry(v.r,v.r,3.6,18);tireGeo.rotateX(Math.PI/2);const spokeGeo=mergeGeometries([0,1,2].map(k=>{const b=new THREE.BoxGeometry(v.r*1.1,.8,3.9);b.rotateZ(k*Math.PI/3);return b}));const rimGeo=new THREE.CylinderGeometry(v.r*.62,v.r*.62,3.8,12);rimGeo.rotateX(Math.PI/2);
  for(const x of [-v.wx,v.wx])for(const z of [-1,1]){const pivot=new THREE.Group();pivot.position.set(x,v.r,z*(v.W/2-1.0));g.add(pivot);
    const wheel=new THREE.Mesh(tireGeo,m.tire);wheel.castShadow=true;pivot.add(wheel);const rim=new THREE.Mesh(rimGeo,m.rim);wheel.add(rim);
    rim.add(new THREE.Mesh(spokeGeo,m.trim));
    g.userData.wheels.push({pivot,wheel,front:x>0})}
  if(sport)sportParts(type,v,add,m,fx,bx);
  if(fleet){
    const stripeMat=new THREE.MeshStandardMaterial({color:stripe,metalness:.4,roughness:.35});
    if(type!=='gt2')for(const z of [-1,1]){const s=new THREE.BoxGeometry(v.L-8,type==='s6'?.8:2.2,.6);s.translate(0,type==='s6'?10:9.4,z*(v.W/2-.1));add(s,stripeMat,false)}
    if(!sport){
    const signTex=canvasTexture(256,96,(c,w,h)=>{c.fillStyle='#f6f3ea';c.fillRect(0,0,w,h);c.fillStyle='#0f5c55';c.font='900 52px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('EC FLEET',w/2,h/2+2)});
    const signMat=new THREE.MeshStandardMaterial({map:signTex,emissive:'#ffffff',emissiveMap:signTex,emissiveIntensity:.25});
    const sign=new THREE.BoxGeometry(5,3.6,13);sign.translate(rear+(front-rear)*.45,top+2.8,0);add(sign,[signMat,signMat,stripeMat,stripeMat,stripeMat,stripeMat],false)}
    const ink=new THREE.Color(paint).getHSL({}).l<.55?'#eef7f4':'#0f5c55';
    const doorTex=canvasTexture(256,64,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle=ink;c.font='800 30px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('ELEMENT CITY · FLEET',w/2,h/2,w-14)});
    const doorMat=new THREE.MeshStandardMaterial({map:doorTex,transparent:true,roughness:.4,polygonOffset:true,polygonOffsetFactor:-2});
    for(const z of [-1,1]){const p=new THREE.PlaneGeometry(sport?20:26,sport?5:6.5);if(z<0)p.rotateY(Math.PI);p.translate(type==='gt2'?-1:-2,type==='gt2'?8.2:type==='s6'?7.4:12.6,z*(v.W/2+.05));add(p,doorMat,false)}
    g.userData.stripe=stripeMat;
  }
  g.userData.paint=paintMat;g.userData.tail=tailMat;g.userData.reverse=reverseMat;g.userData.length=v.L;g.userData.width=v.W;
  return g;
}
/** Merge a static vehicle's parts by material (traffic: ~7 draw calls per car). */
export function compactGroup(group){
  group.updateMatrixWorld(true);const by=new Map();const inv=new THREE.Matrix4().copy(group.matrixWorld).invert();
  group.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.length>1){if(!by.has(mats[0]))by.set(mats[0],[]);by.get(mats[0]).push(o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)));return}
    if(!by.has(o.material))by.set(o.material,[]);by.get(o.material).push(o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)))});
  const out=new THREE.Group();for(const [mat,list] of by){const mesh=new THREE.Mesh(mergeGeometries(list),mat);mesh.castShadow=true;out.add(mesh)}
  group.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose()});out.userData={...group.userData};return out;
}

/** Player car: merge every static part by material but keep the wheel pivots animated (~40 meshes → ~12). */
export function compactDriven(group){const wheels=group.userData.wheels||[];for(const w of wheels)group.remove(w.pivot);
  const out=compactGroup(group);for(const mesh of out.children)mesh.receiveShadow=false;for(const w of wheels)out.add(w.pivot);return out}

/** Instanced ambient traffic: each vehicle type is built once and drawn as one InstancedMesh per material
 * (~8 draw calls per type, and only for types with a car in view). Paint comes from per-instance colours.
 * Each frame: begin(), set(i, proxy, show) for every car, commit(). Hidden cars are packed out (count). */
export class Fleet{
  constructor(parent,specs){this.dummy=new THREE.Object3D();this.slot=[];this.groups=new Map();this.colors=specs.map(s=>new THREE.Color(s.paint||'#c8ccd0'));const byType=new Map();
    specs.forEach((s,i)=>{const t=VEHICLES[s.type]?s.type:'sedan';if(!byType.has(t))byType.set(t,[]);byType.get(t).push(i)});
    for(const [type,ids] of byType){const g=compactGroup(makeVehicle(type,{paint:'#ffffff'})),meshes=[];let paint=null;
      for(const child of g.children){const im=new THREE.InstancedMesh(child.geometry,child.material,ids.length);im.castShadow=true;im.receiveShadow=false;im.frustumCulled=false;
        if(child.material===g.userData.paint){paint=im;ids.forEach((id,k)=>im.setColorAt(k,this.colors[id]))}parent.add(im);meshes.push(im)}
      this.groups.set(type,{meshes,paint,n:0,length:g.userData.length,width:g.userData.width});ids.forEach(id=>this.slot[id]=type)}}
  dims(i){const g=this.groups.get(this.slot[i]);return g?{length:g.length,width:g.width}:{length:64,width:28}}
  begin(){for(const g of this.groups.values())g.n=0}
  /** Place car i from an Object3D-like proxy (position, rotation.y) when show is true. */
  set(i,o,show=true){const g=this.groups.get(this.slot[i]);if(!g||!show)return;const k=g.n++,d=this.dummy;d.position.copy(o.position);d.rotation.set(0,o.rotation.y,0);d.updateMatrix();
    for(const m of g.meshes)m.setMatrixAt(k,d.matrix);g.paint?.setColorAt(k,this.colors[i])}
  commit(){for(const g of this.groups.values())for(const m of g.meshes){m.count=g.n;m.visible=g.n>0;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}
  setShadows(on){for(const g of this.groups.values())for(const m of g.meshes)m.castShadow=on}
}

/** Tyre marks from handbrake slides: one instanced draw call, a capped ring buffer of flat quads that fade out
 * in the shader (each mark stores its birth time; no per-frame buffer updates). */
export class SkidMarks{
  constructor(parent,count=160,life=14){const geo=new THREE.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);this.count=count;this.next=0;this.dummy=new THREE.Object3D();
    this.born=new THREE.InstancedBufferAttribute(new Float32Array(count).fill(-1e4),1);geo.setAttribute('aBorn',this.born);
    const uTime={value:0};this.uTime=uTime;
    this.material=new THREE.MeshBasicMaterial({color:'#121212',transparent:true,opacity:.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    this.material.onBeforeCompile=sh=>{sh.uniforms.uTime=uTime;
      sh.vertexShader='attribute float aBorn;\nuniform float uTime;\nvarying float vFade;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvFade=clamp(1.0-(uTime-aBorn)/${life.toFixed(1)},0.0,1.0);`);
      sh.fragmentShader='varying float vFade;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFade;')};
    this.material.customProgramCacheKey=()=>'skidmarks';
    this.mesh=new THREE.InstancedMesh(geo,this.material,count);this.mesh.frustumCulled=false;this.mesh.renderOrder=1;
    const d=this.dummy;d.scale.set(0,0,0);d.updateMatrix();for(let i=0;i<count;i++)this.mesh.setMatrixAt(i,d.matrix);parent.add(this.mesh)}
  /** Add one mark from (ax,az) to (bx,bz) at height y, width w, born at time t. */
  add(ax,az,bx,bz,y,w,t){const i=this.next;this.next=(i+1)%this.count;const d=this.dummy,L=Math.hypot(bx-ax,bz-az);
    d.position.set((ax+bx)/2,y,(az+bz)/2);d.rotation.set(0,-Math.atan2(bz-az,bx-ax),0);d.scale.set(L+.6,1,w);d.updateMatrix();this.mesh.setMatrixAt(i,d.matrix);
    this.born.setX(i,t);this.born.needsUpdate=true;this.mesh.instanceMatrix.needsUpdate=true}
}

// ---------------------------------------------------------------- grounding
/** Soft round contact shadow (black with a radial alpha falloff). */
export function blobTexture(){return canvasTexture(64,64,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.5,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},{srgb:false})}
/** One instanced draw call of flat blob shadows under cars and people (grounds them when real shadows are off). */
export class Blobs{
  constructor(parent,count){const geo=new THREE.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);this.count=count;this.dummy=new THREE.Object3D();
    this.material=new THREE.MeshBasicMaterial({map:blobTexture(),transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:false});
    this.mesh=new THREE.InstancedMesh(geo,this.material,count);this.mesh.frustumCulled=false;this.mesh.renderOrder=1;parent.add(this.mesh);for(let i=0;i<count;i++)this.hide(i)}
  set(i,x,y,z,yaw,sx,sz){if(i>=this.count)return;const d=this.dummy;d.position.set(x,y,z);d.rotation.set(0,yaw,0);d.scale.set(sx,1,sz);d.updateMatrix();this.mesh.setMatrixAt(i,d.matrix)}
  hide(i){this.set(i,0,-500,0,0,0,0)}
  commit(){this.mesh.instanceMatrix.needsUpdate=true}
}

// ---------------------------------------------------------------- people
export const SKIN=['#8d5524','#c68642','#e0ac69','#f1c27d','#ffdbac','#5c3a21','#a86b3c','#d9a066'];
export const HAIR=['#1c1713','#3b2a1e','#6b4a2b','#c9a66b','#2a2a2a','#8a3b1c'];
export const SHIRTS=['#2f6fb0','#d24d57','#f2c14e','#3fa07b','#ffffff','#8c5bb5','#e07a3c','#36495c','#7fc8d6','#e9e3d3'];
export const PANTS=['#2d3a4e','#1f2326','#5a4e3e','#3e5f7a','#6f6a60','#283b2c'];
/** Articulated, animated player character (faces +x). */
export function makeHuman({skin='#c68642',shirt='#14a38f',pants='#2d3a4e',hair='#1c1713',shoes='#f4f4f2',backpack=true}={}){
  const g=new THREE.Group(),mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.75});
  const S=mat(skin),C=mat(shirt),P=mat(pants),H=mat(hair),F=mat(shoes),B=mat('#e3a23b');
  const part=(geo,m,parent,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o};
  const pivot=(parent,x,y,z)=>{const p=new THREE.Group();p.position.set(x,y,z);parent.add(p);return p};
  const body=pivot(g,0,0,0);
  const pelvis=part(new THREE.CapsuleGeometry(1.75,2.6,4,10),P,body,0,12.9,0);pelvis.rotation.x=Math.PI/2;
  const torso=part(new THREE.CapsuleGeometry(2.35,4.3,4,12),C,body,0,17.5,0);torso.scale.set(.74,1,1.18);
  const collar=part(new THREE.CylinderGeometry(1.25,1.6,1.2,10),C,body,0,20.9,0);void collar;
  part(new THREE.CylinderGeometry(.85,.95,1.8,8),S,body,0,21.7,0);
  const head=part(new THREE.SphereGeometry(2.05,16,12),S,body,.1,23.6,0);head.scale.set(.95,1.1,.9);
  const hairCap=part(new THREE.SphereGeometry(2.17,16,10,0,Math.PI*2,0,Math.PI*.56),H,body,-.12,23.85,0);hairCap.scale.set(1,1.06,.95);
  part(new THREE.SphereGeometry(.42,6,5),S,body,2.05,23.4,0);
  const legs=[],arms=[];
  for(const z of [-1,1]){
    const hip=pivot(body,0,12.6,z*1.5);part(new THREE.CapsuleGeometry(1.42,4.4,4,10),P,hip,0,-3.2,0);
    const knee=pivot(hip,0,-6.4,0);part(new THREE.CapsuleGeometry(1.22,4.2,4,10),P,knee,0,-3,0);
    const shoe=new THREE.BoxGeometry(4.4,1.7,2.5);shoe.translate(.85,-5.55,0);part(shoe,F,knee);
    legs.push({hip,knee});
    const sh=pivot(body,0,20.1,z*3.25);part(new THREE.CapsuleGeometry(.98,3,4,8),C,sh,0,-2.1,0);
    const el=pivot(sh,0,-4.5,0);part(new THREE.CapsuleGeometry(.84,3,4,8),S,el,0,-2,0);part(new THREE.SphereGeometry(.98,8,6),S,el,.15,-4.4,0);
    arms.push({sh,el});
  }
  if(backpack){const pack=new THREE.BoxGeometry(2.6,5.6,4.6);pack.translate(-2.75,17.6,0);part(pack,B,body);const strapG=new THREE.BoxGeometry(.5,6,.6);for(const z of [-1.7,1.7]){const s=strapG.clone();s.translate(1.7,18,z);part(s,mat('#8a5a1a'),body)}}
  g.userData={body,legs,arms,head};return g;
}
/** Pose the player rig. phase: stride phase (radians); amp 0..1 (walk→run); idle breathing. */
export function poseHuman(h,phase,amp,time,reduced){const u=h.userData,s=Math.sin(phase),c=Math.cos(phase),a=reduced?Math.min(amp,.5):amp;
  u.legs[0].hip.rotation.z=s*.62*a;u.legs[1].hip.rotation.z=-s*.62*a;
  u.legs[0].knee.rotation.z=-Math.max(0,-c)*.9*a-.05;u.legs[1].knee.rotation.z=-Math.max(0,c)*.9*a-.05;
  u.arms[0].sh.rotation.z=-s*.55*a;u.arms[1].sh.rotation.z=s*.55*a;u.arms[0].el.rotation.z=.25+.35*a;u.arms[1].el.rotation.z=.25+.35*a;
  u.arms[0].sh.rotation.x=-.08;u.arms[1].sh.rotation.x=.08;
  u.body.position.y=Math.abs(c)*.45*a+(a<.05&&!reduced?Math.sin(time*2)*.08:0);u.body.rotation.z=-.06*a}

/** Instanced crowd: ~10 draw calls for every pedestrian and mission contact. */
export class Crowd{
  constructor(parent,count,{cast=true}={}){
    this.count=count;this.dummy=new THREE.Object3D();this.m=new THREE.Matrix4();this.root=new THREE.Matrix4();this.local=new THREE.Matrix4();
    const mat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.78}),vmat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.78,vertexColors:true});
    const def=(geo,material,pivot,swing)=>{const mesh=new THREE.InstancedMesh(geo,material,count);mesh.castShadow=cast;mesh.receiveShadow=false;mesh.frustumCulled=false;parent.add(mesh);return {mesh,pivot,swing}};
    const legGeo=()=>{const leg=new THREE.CapsuleGeometry(1.32,9,3,6);leg.translate(0,-5.9,0);tint(leg,'#ffffff');const shoe=new THREE.BoxGeometry(4.2,1.7,2.4);shoe.translate(.8,-11.9,0);tint(shoe,'#2a2a2a');return mergeGeometries([leg,shoe])};
    const torso=new THREE.CapsuleGeometry(2.3,4.3,3,8);torso.scale(.74,1,1.16);
    const pelvis=new THREE.CapsuleGeometry(1.7,2.6,2,7);pelvis.rotateX(Math.PI/2);
    const head=new THREE.SphereGeometry(2.05,10,7);head.scale(.95,1.1,.9);const neck=new THREE.CylinderGeometry(.85,.95,2,7);neck.translate(-.1,-2.1,0);
    const hair=new THREE.SphereGeometry(2.16,10,5,0,Math.PI*2,0,Math.PI*.56);hair.scale(1,1.06,.95);
    const upper=new THREE.CapsuleGeometry(.98,3,2,6);upper.translate(0,-2.1,0);
    const fore=new THREE.CapsuleGeometry(.84,3.4,2,6);fore.translate(0,-6.6,0);const hand=new THREE.SphereGeometry(.98,6,4);hand.translate(.1,-9,0);
    this.parts={
      torso:def(torso,mat,[0,17.5,0],0),pelvis:def(pelvis,mat,[0,12.9,0],0),head:def(mergeGeometries([head,neck]),mat,[.1,23.6,0],0),hair:def(hair,mat,[-.12,23.85,0],0),
      legL:def(legGeo(),vmat,[0,12.6,-1.5],1),legR:def(legGeo(),vmat,[0,12.6,1.5],-1),
      armL:def(upper,mat,[0,20.1,-3.25],-.8),armR:def(upper.clone(),mat,[0,20.1,3.25],.8),
      foreL:def(mergeGeometries([fore,hand]),mat,[0,20.1,-3.25],-.8),foreR:def(mergeGeometries([fore.clone(),hand.clone()]),mat,[0,20.1,3.25],.8)};
    this.colorSet=new Set();
  }
  setColors(i,{skin,shirt,pants,hair}){const c=new THREE.Color();const P=this.parts;
    for(const [k,v] of [['torso',shirt],['pelvis',pants],['head',skin],['hair',hair],['legL',pants],['legR',pants],['armL',shirt],['armR',shirt],['foreL',skin],['foreR',skin]])P[k].mesh.setColorAt(i,c.set(v));}
  /** Place instance i at (x,y,z) facing yaw, stride phase/amp; wave=true raises an arm. */
  set(i,x,y,z,yaw,phase,amp,{visible=true,wave=0,scale=1}={}){
    const P=this.parts,s=Math.sin(phase),bob=Math.abs(Math.cos(phase))*.4*amp;
    this.dummy.position.set(x,visible?y+bob:-500,z);this.dummy.rotation.set(0,-yaw,0);this.dummy.scale.setScalar(visible?scale:.001);this.dummy.updateMatrix();this.root.copy(this.dummy.matrix);
    for(const k in P){const p=P[k];let ang=p.swing*s*.6*amp;if(wave&&(k==='armR'||k==='foreR'))ang=2.6+Math.sin(wave*6)*.25;
      this.local.makeRotationZ(ang);this.local.setPosition(p.pivot[0],p.pivot[1],p.pivot[2]);this.m.multiplyMatrices(this.root,this.local);p.mesh.setMatrixAt(i,this.m)}
  }
  commit(){for(const k in this.parts){const mesh=this.parts[k].mesh;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor&&!this.colorsCommitted)mesh.instanceColor.needsUpdate=true}this.colorsCommitted=true}
}

// ---------------------------------------------------------------- vegetation
export function palmGeometries(){
  const trunk=new THREE.CylinderGeometry(1.5,2.6,130,6,6,true);trunk.translate(0,65,0);const p=trunk.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i),t=y/130;p.setX(i,p.getX(i)+Math.pow(t,2)*14);const ring=(Math.floor(y/5)%2)?1.06:1;p.setZ(i,p.getZ(i)*ring);p.setX(i,p.getX(i)*(1+(ring-1)*.5))}
  trunk.computeVertexNormals();
  const fronds=[];const r=rng(9);
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2+r()*.3,len=34+r()*10,droop=.55+r()*.35,pos=[],seg=5;
    for(let s=0;s<seg;s++){const t0=s/seg,t1=(s+1)/seg,w0=(1-t0)*4.6+.4,w1=(1-t1)*4.6+.4;
      const pt=t=>{const d=t*len;return [Math.cos(a)*d,Math.sin(t*Math.PI*.55)*8-droop*t*t*len*.9,Math.sin(a)*d]};
      const p0=pt(t0),p1=pt(t1),nx=-Math.sin(a),nz=Math.cos(a);
      const L0=[p0[0]+nx*w0,p0[1]-1.4*w0*.3,p0[2]+nz*w0],R0=[p0[0]-nx*w0,p0[1]-1.4*w0*.3,p0[2]-nz*w0],L1=[p1[0]+nx*w1,p1[1]-1.4*w1*.3,p1[2]+nz*w1],R1=[p1[0]-nx*w1,p1[1]-1.4*w1*.3,p1[2]-nz*w1];
      pos.push(...p0,...L0,...L1, ...p0,...L1,...p1, ...p0,...p1,...R1, ...p0,...R1,...R0)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();fronds.push(g)}
  const crown=mergeGeometries(fronds);crown.translate(14,128,0);
  const nuts=new THREE.SphereGeometry(2.2,5,4);const nutList=[];for(let k=0;k<3;k++){const n=nuts.clone();n.translate(14+Math.cos(k*1.6)*2.4,124,Math.sin(k*1.6)*2.4);nutList.push(n)}
  const nutGeo=mergeGeometries(nutList);
  return {trunk,crown,nuts:nutGeo};
}
export function treeGeometries(){const trunk=new THREE.CylinderGeometry(1.6,2.4,34,7);trunk.translate(0,17,0);
  const crown=new THREE.IcosahedronGeometry(22,1);const p=crown.attributes.position,r=rng(4);for(let i=0;i<p.count;i++){const k=.82+r()*.3;p.setXYZ(i,p.getX(i)*k,p.getY(i)*k*.9,p.getZ(i)*k)}crown.computeVertexNormals();crown.translate(0,48,0);
  return {trunk,crown}}
export {clamp};
