/** Element City v5 — real-time 3D city. Original procedural art; physics and map data are
 * shared with the tested 2D fallback (world.js). Public API is unchanged from v4. */
import {driveStep,cameraSafePosition} from './driving.js?v=5.3.6';
import {POWER_POINTS,powerStep,cableState,benchDone} from './power-scene.js?v=5.3.6';
import {GATE_SLOTS,gateCrossing,READINGS,RELAYS,uiOf} from './campaign.js?v=5.3.6';
import {routeTo,snapToRoad} from './navigation.js?v=5.3.6';
import {ELEMENTS} from './elements.js?v=5.3.6';
import * as THREE from './vendor/three.module.js';
import {CityWorld as FlatWorld,WORLD,stations,buildings,circleCollides,moveWithCollisions,collisionKeep,signalPhase,pedestrianAt,ELEMENT_COINS,COIN_PICKUP} from './world.js?v=5.3.6';
import {FLOOR,GROUND,BAY,CURB,rng,canvasTexture,mergeGeometries,tint,Batch,facadeBox,splitBox,asphaltTexture,paverTexture,grassTexture,roofTexture,chevronTexture,
  STYLES,facadeMaterials,storefrontMaterial,textAtlas,signQuad,makeVehicle,compactGroup,makeHuman,poseHuman,Crowd,SKIN,HAIR,SHIRTS,PANTS,palmGeometries,treeGeometries,
  CITY_LIGHTS,vehicleLights,compactDriven,Blobs,Fleet,SkidMarks,VEHICLES} from './assets3d.js?v=5.3.6';
import {sampleDay,litFraction,TIME_MODES,DAY_START,HOURS_PER_SECOND} from './daylight.js?v=5.3.6';
export {WORLD,stations,buildings,circleCollides,moveWithCollisions,ELEMENT_COINS};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ROAD_X=[450,1200,1950],ROAD_Y=[400,950,1500];
const RX_ALL=[-1800,-1050,-300,450,1200,1950],RY_ALL=[-1100,-350,400,950,1500,2250,3000];
const EXT={minX:-2600,maxX:2247,minY:-1850,maxY:3700};
const SEA_X=2262;
const SUN=new THREE.Vector3(.78,.5,.36).normalize();
// Colour grade inside the existing tone-mapping step (no post-processing pass): neutral tone curve,
// a little extra saturation, cool shadows and warm highlights. Must run before any shader compiles.
THREE.ShaderChunk.tonemapping_pars_fragment=THREE.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',
  'vec3 CustomToneMapping( vec3 color ) { vec3 c=NeutralToneMapping( color ); float l=dot(c,vec3(.2126,.7152,.0722)); c=max(mix(vec3(l),c,1.12),0.);'+
  ' c=mix(c*vec3(.95,1.,1.05),c*vec3(1.05,1.,.93),smoothstep(.15,.75,l)); return clamp(pow(c,vec3(.97)),0.,1.); }');
/** Soft radial glow sprite/texture (white centre → transparent edge). */
function glowTexture(size=64,inner=.18){return canvasTexture(size,size,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(inner,'rgba(255,255,255,.55)');g.addColorStop(.5,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},{srgb:false})}
const hash01=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const LENS_DAY=new THREE.Color('#cfcabb'),LENS_ON=new THREE.Color('#ffe2b0').multiplyScalar(1.6),LENS_OFF=new THREE.Color('#3b3d42'),LAMP_WARM=new THREE.Color('#ffb466');
/** Speed shown in the HUD: world units/s → km/h at the visual scale (15 units ≈ 1 m). */
export const toKmh=speed=>Math.round(Math.abs(speed)/15*3.6);
/** Decorative lawns: kept off every road and sidewalk (see release5 tests). */
export const LAWNS=[[700,1270,860,1405],[1380,1270,1560,1405],[90,800,330,850],[960,700,1100,820]];
/** Courier drop zones: one doorstep per building, on the side nearest a street. */
export const DROP_ZONES=buildings.map(b=>{const c=[{x:b.x+b.w/2,y:b.y-24},{x:b.x+b.w/2,y:b.y+b.h+24},{x:b.x-24,y:b.y+b.h/2},{x:b.x+b.w+24,y:b.y+b.h/2}].filter(q=>!circleCollides(q.x,q.y,12));
  const roadDist=q=>Math.min(...ROAD_X.map(r=>Math.abs(q.x-r)),...ROAD_Y.map(r=>Math.abs(q.y-r)));c.sort((a,b2)=>roadDist(a)-roadDist(b2));const q=c[0]||{x:b.x+b.w/2,y:b.y+b.h+24};return {id:'drop-'+b.mark,kind:'drop',symbol:b.mark,name:b.name,x:q.x,y:q.y}});
/** City Share cars: authorized fleet vehicles parked off the street that anyone on the response team may borrow. */
export const FLEET_SPEC={id:'fleet',type:'compact',paint:'#eef2ef',stripe:'#14a38f'};
export const PARKED_SPOTS=[
 {id:'share-1',x:575,y:1300,angle:Math.PI/2,type:'sedan',paint:'#b3262e',stripe:'#ffffff'},
 {id:'share-2',x:1580,y:1064,angle:Math.PI,type:'suv',paint:'#1d3557',stripe:'#ffcc33'},
 {id:'share-3',x:1360,y:843,angle:0,type:'van',paint:'#f2f2ee',stripe:'#14a38f'},
 {id:'share-4',x:1780,y:790,angle:0,type:'compact',paint:'#f2c14e',stripe:'#1d3557'},
 {id:'share-5',x:348,y:1655,angle:-Math.PI/2,type:'sedan',paint:'#9aa3a8',stripe:'#d24d57'},
 {id:'share-6',x:860,y:1242,angle:0,type:'suv',paint:'#2e6b4f',stripe:'#ffffff'}];
const CAR_DIMS={compact:[58,27],sedan:[68,28],suv:[70,30],van:[76,31]};
/** Axis-aligned box around a parked car (rotated footprint), for collisions. */
export function carBox(c){const [L,W]=CAR_DIMS[c.spec?.type||c.type]||[64,28],ca=Math.abs(Math.cos(c.angle||0)),sa=Math.abs(Math.sin(c.angle||0)),hw=(L*ca+W*sa)/2,hh=(L*sa+W*ca)/2;return {x:c.x-hw,y:c.y-hh,w:hw*2,h:hh*2}}
export const QUALITY={high:{dpr:1.6,shadow:2048,shadows:true},balanced:{dpr:1.3,shadow:1024,shadows:true},low:{dpr:1,shadow:0,shadows:false}};
const STREET_NAMES={x450:'MEITNER ST',x1200:'CURIE AVE',x1950:'HARBOR DR',y400:'ALKALI AVE',y950:'TRANSITION BLVD',y1500:'RESEARCH LOOP'};
/** Ground height: roads sit slightly below the sidewalk/plaza level. */
export function groundHeight(x,z){if(x>SEA_X)return 0;for(const r of RX_ALL)if(Math.abs(x-r)<60)return .25;for(const r of RY_ALL)if(Math.abs(z-r)<60&&x<SEA_X)return .25;return CURB}
/** Floors used for a gameplay building (tall enough to read as a real downtown). */
export const floorsFor=b=>clamp(Math.round(b.height/3.2),4,19);
export const buildingHeight=b=>GROUND+(floorsFor(b)-1)*FLOOR;

function skyMaterial(sun=SUN){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uSun:{value:sun},uTop:{value:new THREE.Color('#3f7fc4')},uHorizon:{value:new THREE.Color('#f1d2a8')},uMid:{value:new THREE.Color('#9cc5e6')},uGround:{value:new THREE.Color('#8a9a9a')},uFog:{value:new THREE.Color('#d8d2c2')},uNight:{value:0}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize((modelMatrix*vec4(position,0.)).xyz);gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uSun,uTop,uHorizon,uMid,uGround,uFog;uniform float uNight;varying vec3 vDir;
  float hs(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
  void main(){vec3 d=normalize(vDir);float h=d.y;vec3 col=mix(uHorizon,uMid,smoothstep(0.,.18,h));col=mix(col,uTop,smoothstep(.15,.85,h));
   col=mix(col,uGround,smoothstep(0.,-.08,h));float s=max(dot(d,uSun),0.),day=1.-uNight;
   col+=(vec3(1.,.72,.42)*pow(s,6.)*.35+vec3(1.,.85,.6)*pow(s,64.)*.5)*day+vec3(1.,.95,.85)*smoothstep(.9993,.9997,s)*6.*day;
   col+=uNight*(vec3(.55,.65,.9)*pow(s,48.)*.22+vec3(.92,.95,1.)*smoothstep(.99955,.9998,s)*2.4);
   col+=vec3(.9,.93,1.)*step(.9975,hs(floor(d*420.)))*uNight*smoothstep(.04,.3,h)*(.5+.5*hs(floor(d*420.)+7.));
   col=mix(col,uFog,1.-smoothstep(-.02,.10,h));
   gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`})}
function waterMaterial(sun=SUN){const m=new THREE.ShaderMaterial({fog:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uSun:{value:SUN},uDeep:{value:new THREE.Color('#0a3550')},uShallow:{value:new THREE.Color('#16808f')},uSky:{value:new THREE.Color('#a9cfe8')},uSunCol:{value:new THREE.Color('#ffe2b0')}}]),
  vertexShader:`varying vec3 vW;
  #include <fog_pars_vertex>
  void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader:`uniform float uTime;uniform vec3 uSun,uDeep,uShallow,uSky,uSunCol;varying vec3 vW;
  #include <fog_pars_fragment>
  float h(vec2 p){return sin(p.x*.021+uTime*1.2)*.6+sin(p.y*.017-uTime*1.)*.6+sin((p.x+p.y)*.043+uTime*1.8)*.3+sin((p.x-p.y*.7)*.09+uTime*2.5)*.16+sin((p.x*.8+p.y)*.21-uTime*3.)*.07;}
  void main(){vec2 p=vW.xz;float e=1.5;float hx=h(p+vec2(e,0.))-h(p-vec2(e,0.));float hz=h(p+vec2(0.,e))-h(p-vec2(0.,e));
   vec3 n=normalize(vec3(-hx*.8,2.*e,-hz*.8));vec3 v=normalize(cameraPosition-vW);float fres=pow(1.-max(dot(n,v),0.),4.);
   vec3 col=mix(uDeep,uShallow,clamp(1.-(vW.x-2262.)/900.,0.,1.)*.55);col=mix(col,uSky,.05+.55*fres);
   vec3 r=reflect(-v,n);float s=max(dot(r,uSun),0.);col+=uSunCol*(pow(s,220.)*3.5+pow(s,20.)*.18);
   float foam=smoothstep(26.,0.,vW.x-2262.)*(.55+.45*sin(vW.z*.07+uTime*2.2));col=mix(col,vec3(.93,.95,.95),foam*.45);
   gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   #include <fog_fragment>
  }`});m.uniforms.uSun.value=sun;return m}
function beamMaterial(color){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,toneMapped:false,
  uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:.6}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uColor;uniform float uOpacity;varying vec2 vUv;void main(){float a=pow(1.-vUv.y,1.7)*uOpacity*(.75+.25*sin(vUv.x*62.83));gl_FragColor=vec4(uColor*a,a);\n#include <colorspace_fragment>\n}'})}
function spriteLabel(text,color='#ffffff',bg='rgba(12,22,28,.82)',width=320){const tex=canvasTexture(512,96,(c,w,h)=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,8,w-8,h-16,14);c.fill();c.fillStyle=color;c.fillRect(4,8,10,h-16);
  c.font='800 40px system-ui,-apple-system,sans-serif';c.fillStyle='#ffffff';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2+6,h/2+2,w-40)});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true,sizeAttenuation:false,fog:false,toneMapped:false}));s.scale.set(width/1000,width/1000*96/512,1);s.renderOrder=10;return s}
function iconTexture(code,color,done){return canvasTexture(128,128,(c,w,h)=>{c.fillStyle='rgba(10,18,24,.88)';c.beginPath();c.roundRect(10,10,108,108,22);c.fill();c.lineWidth=7;c.strokeStyle=color;c.stroke();
  c.fillStyle=color;c.font='900 54px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(done?'✓':code,64,68)})}

export class CityWorld extends FlatWorld{
  constructor(canvas,minimap,callbacks={}){
    // A tiny scratch canvas lets the shared 2D engine initialise without claiming the WebGL surface.
    const scratch=document.createElement('canvas');scratch.width=scratch.height=1;scratch.getBoundingClientRect=()=>canvas.getBoundingClientRect();
    super(scratch,minimap,callbacks);
    this.surface.width=this.surface.height=1;this.flatCanvas=scratch;this.canvas=canvas;
    this.viewMode='chase';this.cameraYaw=-Math.PI/2;this.cameraPitch=.22;this.orbitOffset=0;this.pitchOffset=0;
    this.touchMode=window.matchMedia?.('(pointer:coarse)').matches||false;this.frameDelta=1/60;this.stick={x:0,y:0};
    this.onWorldAction=callbacks.onWorldAction||(()=>{});this.lastLookAt=0;this.wheelPhase=0;this.walkPhase=0;this.carYaw=null;
    this.avatarY=CURB;this.carY=.25;this.clockLast=performance.now();this.lastRender=0;this.radarAt=0;this.route=[];this.routeKey='';
    this.quality=this.touchMode?'balanced':'high';this.fpsWindow={t:0,n:0,low:0};
    this.timeMode='auto';this.dayHour=DAY_START;this.sunDir=SUN.clone();this.night=0;this.dayAt=-1;this.litTarget=litFraction(0);this.nightMats=[];
    try{this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',stencil:false})}catch(error){super.destroy();throw error}
    const r=this.renderer;r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.CustomToneMapping;r.toneMappingExposure=1;
    r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog('#d8d2c2',900,7800);
    this.viewCamera=new THREE.PerspectiveCamera(60,1,3,16000);this.viewCamera.position.set(520,60,1150);
    this.disposables=[];this.markerGroups=new Map();
    this.buildEnvironment();this.buildGround();this.buildBuildings();this.buildWater();this.buildProps();
    this.buildMarkers();this.buildWorkshop();this.buildSurvey();this.buildRelays();this.buildGates();this.buildFountains();this.buildDropZones();this.buildSecrets();this.buildVehicles();this.buildPeople();this.buildRouteLine();this.buildNightLights();this.skids=new SkidMarks(this.scene);
    this.applyQuality(this.quality);this.applyDay(this.dayHour);
    this.tmpM4=new THREE.Matrix4();this.raycaster=new THREE.Raycaster();this.lookTarget=new THREE.Vector3();this.desiredCamera=new THREE.Vector3();this.camTarget=new THREE.Vector3();this.tmp=new THREE.Vector3();
    this.cameraObstacles=buildings.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,height:(buildingHeight(b)+CURB)/3.1}));
    this.drag=null;
    this.pointerDown=e=>{if(e.button!==0&&e.pointerType==='mouse')return;if(this.config.paused||this.drag)return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};try{canvas.setPointerCapture(e.pointerId)}catch{}};
    this.pointerMove=e=>{if(!this.drag||this.drag.id!==e.pointerId||this.config.paused)return;this.drag.moved||=Math.hypot(e.clientX-this.drag.startX,e.clientY-this.drag.startY)>8;if(!this.drag.moved)return;
      this.lastLookAt=this.time;const k=.0055*(this.config.cameraSensitivity||1),dx=(e.clientX-this.drag.x)*k,dy=(e.clientY-this.drag.y)*k;this.drag.x=e.clientX;this.drag.y=e.clientY;
      if(this.player.inVehicle)this.orbitOffset=wrap(this.orbitOffset+dx);else this.cameraYaw=wrap(this.cameraYaw+dx);this.pitchOffset=clamp(this.pitchOffset+dy*.8,-.26,.7)};
    this.pointerUp=e=>{if(this.drag?.id!==e.pointerId)return;const tap=!this.drag.moved&&e.type==='pointerup';this.drag=null;if(tap)this.tapWorkshop(e)};
    canvas.addEventListener('pointerdown',this.pointerDown);canvas.addEventListener('pointermove',this.pointerMove);
    for(const t of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(t,this.pointerUp);
    this.contextLost=e=>{e.preventDefault();this.updateConfig({paused:true});callbacks.onContextLost?.()};canvas.addEventListener('webglcontextlost',this.contextLost);
    this.resize();this.snapCamera=true;
    // compile the night-only effects up front too, so dusk never stalls on a shader compile
    const nightFx=[this.pools,this.coronas,this.carGlow,this.beams],shown=nightFx.map(o=>o.visible);nightFx.forEach(o=>o.visible=true);
    try{r.compile(this.scene,this.viewCamera)}catch{}nightFx.forEach((o,i)=>o.visible=shown[i]);
  }
  drawStatic(){/* 3D mode: the 2400×1800 overview bitmap is unnecessary (saves ~17 MB). */}
  resize(){
    if(!this.renderer){const rect=this.canvas?.getBoundingClientRect?.();this.width=rect?.width||window.innerWidth;this.height=rect?.height||window.innerHeight;this.dpr=1;return}
    const rect=this.canvas.getBoundingClientRect();this.width=rect.width||window.innerWidth;this.height=rect.height||window.innerHeight;
    this.dpr=Math.min(window.devicePixelRatio||1,QUALITY[this.quality].dpr);this.zoom=1;
    this.renderer.setPixelRatio(this.dpr);this.renderer.setSize(this.width,this.height,false);this.viewCamera.aspect=this.width/this.height;this.viewCamera.updateProjectionMatrix();
    if(this.minimap){const m=this.minimap.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);this.mapWidth=m.width||160;this.mapHeight=m.height||160;this.minimap.width=Math.round(this.mapWidth*d);this.minimap.height=Math.round(this.mapHeight*d);this.mapDpr=d}
    this.lastRender=0;
  }
  applyQuality(name){if(!QUALITY[name])name='balanced';this.quality=name;const q=QUALITY[name];
    const wasEnabled=this.renderer.shadowMap.enabled;this.renderer.shadowMap.enabled=q.shadows;this.sun.castShadow=q.shadows;
    if(q.shadows&&this.sun.shadow.mapSize.x!==q.shadow){this.sun.shadow.mapSize.set(q.shadow,q.shadow);this.sun.shadow.map?.dispose();this.sun.shadow.map=null}
    if(wasEnabled!==q.shadows)this.scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.needsUpdate=true});
    // shadow frustum: wider on high (2048 map ≈ .62 units per texel); crowd only casts real shadows on high
    const ext=name==='high'?640:520,sc=this.sun.shadow.camera;sc.left=sc.bottom=-ext;sc.right=sc.top=ext;sc.updateProjectionMatrix();
    if(this.crowd)for(const k in this.crowd.parts)this.crowd.parts[k].mesh.castShadow=name==='high';
    this.trafficFleet?.setShadows(name==='high');if(this.skids)this.skids.mesh.visible=name!=='low';
    if(this.blobs)this.blobs.material.opacity=q.shadows?.32:.6;
    if(this.contactShade)this.contactShade.material.opacity=q.shadows?.8:1;
    this.dayAt=-1;
    if(this.canvas&&this.width)this.resize();return name}
  // ------------------------------------------------------------------ scene construction
  buildEnvironment(){
    const sky=new THREE.Mesh(new THREE.SphereGeometry(12000,32,16),skyMaterial(this.sunDir));sky.frustumCulled=false;sky.renderOrder=-1;this.scene.add(sky);this.sky=sky;
    // Image-based reflections from the same procedural sky (no downloaded HDRI).
    const pm=new THREE.PMREMGenerator(this.renderer),envScene=new THREE.Scene();const envSky=new THREE.Mesh(new THREE.SphereGeometry(100,32,16),skyMaterial());envScene.add(envSky);
    const ground=new THREE.Mesh(new THREE.CircleGeometry(100,24),new THREE.MeshBasicMaterial({color:'#6d7468'}));ground.rotation.x=-Math.PI/2;ground.position.y=-2;envScene.add(ground);
    this.envTarget=pm.fromScene(envScene,.02);this.scene.environment=this.envTarget.texture;pm.dispose();envSky.geometry.dispose();ground.geometry.dispose();
    this.scene.environmentIntensity=.7;this.hemi=new THREE.HemisphereLight('#bcd6f0','#6b5f4c',.35);this.scene.add(this.hemi);
    const sun=this.sun=new THREE.DirectionalLight('#ffd6a0',4.2);sun.position.copy(SUN).multiplyScalar(2400);sun.target.position.set(0,0,0);this.scene.add(sun,sun.target);
    const s=sun.shadow;s.camera.left=-520;s.camera.right=520;s.camera.top=520;s.camera.bottom=-520;s.camera.near=10;s.camera.far=5200;s.bias=-.0006;s.normalBias=1.2;s.mapSize.set(1024,1024);s.intensity=.85;
    // clouds
    const cloudTex=canvasTexture(256,128,(c,w,h)=>{const r=rng(31);for(let i=0;i<26;i++){const x=40+r()*176,y=50+r()*40,rad=18+r()*30,g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,'rgba(255,250,244,.9)');g.addColorStop(1,'rgba(255,240,230,0)');c.fillStyle=g;c.fillRect(0,0,w,h)}});
    this.cloudMat=new THREE.SpriteMaterial({map:cloudTex,fog:false,transparent:true,depthWrite:false,opacity:.85});
    const cr=rng(77);for(let i=0;i<14;i++){const sp=new THREE.Sprite(this.cloudMat);const a=cr()*Math.PI*2,d=5200+cr()*4500;
      sp.position.set(1200+Math.cos(a)*d,1500+cr()*1300,900+Math.sin(a)*d);sp.scale.set(2600+cr()*2200,900+cr()*500,1);this.scene.add(sp)}
    // distant hills (west/north/south) and an ocean horizon to the east
    const pos=[],R=9200,seg=96,hr=rng(12);let prev=null;
    for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,east=Math.max(0,Math.cos(a));const hgt=(380+hr()*900+Math.sin(a*5)*240)*(1-east*.92);const x=1200+Math.cos(a)*R,z=900+Math.sin(a)*R;const cur=[x,z,hgt];
      if(prev)pos.push(prev[0],-5,prev[1],cur[0],-5,cur[1],cur[0],cur[2],cur[1],prev[0],-5,prev[1],cur[0],cur[2],cur[1],prev[0],prev[2],prev[1]);prev=cur}
    const hills=new THREE.BufferGeometry();hills.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));hills.computeVertexNormals();
    this.scene.add(new THREE.Mesh(hills,new THREE.MeshStandardMaterial({color:'#7f9585',roughness:1,side:THREE.DoubleSide})));
    const land=new THREE.Mesh(new THREE.PlaneGeometry(26000,26000),new THREE.MeshStandardMaterial({color:'#748466',roughness:1}));land.rotation.x=-Math.PI/2;land.position.set(1200-13000+SEA_X-1200,-1.2,900);this.scene.add(land);
  }
  buildGround(){
    const asphalt=asphaltTexture(),pavers=paverTexture(),grass=grassTexture();
    const aMat=new THREE.MeshStandardMaterial({map:asphalt,roughness:.93,metalness:0}),pMat=new THREE.MeshStandardMaterial({map:pavers,roughness:.88}),gMat=new THREE.MeshStandardMaterial({map:grass,roughness:1});
    const white=new THREE.MeshStandardMaterial({color:'#eeeeea',roughness:.7,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const yellow=new THREE.MeshStandardMaterial({color:'#e8b730',roughness:.7,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const quad=(x0,z0,x1,z1,y,uv=40)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0);g.rotateX(-Math.PI/2);g.translate((x0+x1)/2,y,(z0+z1)/2);const p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,p.getX(i)/uv,-p.getZ(i)/uv);return g};
    const roads=new Batch(),blocks=new Batch(),marks=new Batch();
    for(const y of RY_ALL)roads.add(aMat,quad(EXT.minX,y-60,SEA_X,y+60,.25,120));
    for(const x of RX_ALL){const ys=[EXT.minY,...RY_ALL,EXT.maxY];for(let i=0;i<ys.length-1;i++){const a=i?ys[i]+60:ys[i],b=i<ys.length-2?ys[i+1]-60:ys[i+1];if(b>a)roads.add(aMat,quad(x-60,a,x+60,b,.25,120))}}
    // Blocks (plazas + sidewalks) at curb height, with curb faces toward the streets.
    const xs=[EXT.minX,...RX_ALL,SEA_X-15],zs=[EXT.minY,...RY_ALL,EXT.maxY];this.blocks=[];
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x0=i?xs[i]+60:xs[i],x1=i<xs.length-2?xs[i+1]-60:xs[i+1],z0=j?zs[j]+60:zs[j],z1=j<zs.length-2?zs[j+1]-60:zs[j+1];if(x1<=x0||z1<=z0)continue;
      this.blocks.push({x0,x1,z0,z1});blocks.add(pMat,quad(x0,z0,x1,z1,CURB));
      const curb=(w,d,x,z)=>{const g=new THREE.BoxGeometry(w,CURB,d);g.translate(x,CURB/2,z);blocks.add(pMat,g)};
      curb(x1-x0,.6,(x0+x1)/2,z0+.3);curb(x1-x0,.6,(x0+x1)/2,z1-.3);curb(.6,z1-z0,x0+.3,(z0+z1)/2);curb(.6,z1-z0,x1-.3,(z0+z1)/2)}
    // Lane markings, crosswalks and stop lines (right-hand traffic).
    const strip=(mat,x0,z0,x1,z1)=>marks.add(mat,quad(x0,z0,x1,z1,.34,40));
    const segX=(x,a,b)=>{strip(yellow,x-2.4,a,x-.9,b);strip(yellow,x+.9,a,x+2.4,b);strip(white,x-55,a,x-53.6,b);strip(white,x+53.6,a,x+55,b)};
    const segY=(z,a,b)=>{strip(yellow,a,z-2.4,b,z-.9);strip(yellow,a,z+.9,b,z+2.4);strip(white,a,z-55,b,z-53.6);strip(white,a,z+53.6,b,z+55)};
    for(const x of RX_ALL){const ys=[EXT.minY,...RY_ALL,EXT.maxY];for(let i=0;i<ys.length-1;i++){const a=(i?ys[i]+92:ys[i]),b=(i<ys.length-2?ys[i+1]-92:ys[i+1]);if(b>a)segX(x,a,b)}}
    for(const z of RY_ALL){const xs2=[EXT.minX,...RX_ALL,SEA_X];for(let i=0;i<xs2.length-1;i++){const a=(i?xs2[i]+92:xs2[i]),b=(i<xs2.length-2?xs2[i+1]-92:xs2[i+1]-10);if(b>a)segY(z,a,b)}}
    for(const x of RX_ALL)for(const z of RY_ALL){
      for(let k=-50;k<=46;k+=12){strip(white,x+k,z-86,x+k+6,z-64);strip(white,x+k,z+64,x+k+6,z+86);strip(white,x-86,z+k,x-64,z+k+6);strip(white,x+64,z+k,x+86,z+k+6)}
      strip(white,x-56,z-92,x-2,z-89);strip(white,x+2,z+89,x+56,z+92);strip(white,x+89,z-56,x+92,z-2);strip(white,x-92,z+2,x-89,z+56)}
    // Fleet parking bay beside HQ
    const bay=(x0,z0,x1,z1)=>{strip(white,x0,z0,x1,z0+1.5);strip(white,x0,z1-1.5,x1,z1);strip(white,x0,z0,x0+1.5,z1);strip(white,x1-1.5,z0,x1,z1)};
    bay(545,1006,616,1044);
    roads.build(this.scene,{cast:false});blocks.build(this.scene,{cast:false});marks.build(this.scene,{cast:false,receive:true});
    // Lawns in open plaza space (decorative, walkable)
    const lawns=new Batch();for(const [x0,z0,x1,z1] of LAWNS)lawns.add(gMat,quad(x0,z0,x1,z1,CURB+.12,60));
    lawns.build(this.scene,{cast:false});
    this.materials={aMat,pMat,gMat,white,yellow};this.disposables.push(asphalt,pavers,grass);
  }
  buildBuildings(){
    const facades=facadeMaterials(1.1),store=storefrontMaterial(),roof=new THREE.MeshStandardMaterial({map:roofTexture(),roughness:.95,color:'#ffffff'});
    const trim=new THREE.MeshStandardMaterial({color:'#e9e4da',roughness:.8}),dark=new THREE.MeshStandardMaterial({color:'#5d6366',roughness:.7,metalness:.2});
    const awningMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,side:THREE.DoubleSide});
    const tints={glass:['#c9dde2','#bcd3e6','#d6e0d8','#c3cbd8'],deco:['#f2b8a2','#9fd8c9','#f6d7a7','#c3b3e3','#a7cbe8','#f4c7d6','#f5e6b8'],brick:['#ffffff','#f1d9cf','#e6d3c6'],concrete:['#ffffff','#e6e1d6','#d9dde0']};
    const awn=['#c0392b','#1f6f8b','#2e8b57','#e67e22','#7d3c98','#f1c40f'];
    const sides=new Batch(),r=rng(2024),props=new Batch(),ur=rng(4242),feet=[];
    const addBuilding=(x,z,w,d,floors,style,color,{storefront=true,parapet=true,detail=true}={})=>{
      const base=CURB;let top=base;feet.push([x,z,w,d]);
      if(storefront){const g=facadeBox(w,GROUND,d,BAY*4,GROUND);g.translate(x+w/2,base+GROUND/2,z+d/2);const sp=splitBox(g);tint(sp.sides,'#ffffff');sides.add(store,sp.sides);sp.top.dispose();top+=GROUND;
        sides.box(trim,w+3,3,d+3,x+w/2,top,z+d/2)}
      const upper=floors-(storefront?1:0),hgt=upper*FLOOR;
      const setback=detail&&floors>=12?10:0;
      const g=facadeBox(w-setback*2,hgt,d-setback*2,BAY*4,FLOOR*4);g.translate(x+w/2,top+hgt/2,z+d/2);
      {const uo=Math.floor(ur()*97),vo=Math.floor(ur()*31),fu=g.attributes.uv;for(let i=0;i<fu.count;i++)fu.setXY(i,fu.getX(i)+uo,fu.getY(i)+vo)} // whole-tile shift: same look, unique lit-window pattern
      const sp=splitBox(g);tint(sp.sides,color);sides.add(facades[style],sp.sides);
      const roofTop=sp.top;const u=roofTop.attributes.uv,rp=roofTop.attributes.position;for(let i=0;i<u.count;i++)u.setXY(i,rp.getX(i)/60,rp.getZ(i)/60);sides.add(roof,roofTop);
      if(setback){const ledge=new THREE.BoxGeometry(w,2.5,d);ledge.translate(x+w/2,top+FLOOR*2,z+d/2);sides.add(trim,ledge)}
      const rt=top+hgt,ix=x+setback,iz=z+setback,iw=w-setback*2,id=d-setback*2;
      if(parapet){sides.box(trim,iw,5,2,ix+iw/2,rt+2.5,iz+1);sides.box(trim,iw,5,2,ix+iw/2,rt+2.5,iz+id-1);sides.box(trim,2,5,id,ix+1,rt+2.5,iz+id/2);sides.box(trim,2,5,id,ix+iw-1,rt+2.5,iz+id/2)}
      if(detail){const n=1+Math.floor(r()*3);for(let k=0;k<n;k++)props.box(dark,14+r()*10,8,10+r()*8,ix+20+r()*(iw-40),rt+4,iz+20+r()*(id-40));
        if(style==='brick'&&iw>70){const tank=new THREE.CylinderGeometry(8,8,14,12);tank.translate(ix+iw-22,rt+20,iz+22);props.add(dark,tank);for(const [dx,dz] of [[-5,-5],[5,-5],[-5,5],[5,5]])props.box(dark,1.2,10,1.2,ix+iw-22+dx,rt+5,iz+22+dz)}}
      return rt;
    };
    // gameplay buildings (collision footprints from world.js)
    const names=buildings.map(b=>b.name),marks=buildings.map(b=>b.mark);
    const nameAtlas=textAtlas(names,{cols:2,slotW:512,slotH:64,draw:(c,t,w,h)=>{c.fillStyle='#1b2226';c.fillRect(0,0,w,h);c.fillStyle='#f4efe2';c.font='800 34px system-ui,-apple-system,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t,w/2,h/2+2,w-24)}});
    const tileAtlas=textAtlas(marks,{cols:4,slotW:128,slotH:128,draw:(c,t,w,h,i)=>{const el=ELEMENTS.find(e=>e.symbol===t);const hue=['#1d6f74','#2b5d8a','#7a4f9a','#9a5a2b','#2d7a4f','#8a3b4a'][i%6];
      c.fillStyle=hue;c.fillRect(0,0,w,h);c.strokeStyle='#ffffffcc';c.lineWidth=6;c.strokeRect(6,6,w-12,h-12);c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.font=`900 ${t.length>2?40:58}px system-ui,sans-serif`;c.fillText(t,w/2,h/2+8);
      if(el){c.font='700 20px system-ui,sans-serif';c.textAlign='left';c.fillText(String(el.number),14,24)}}});
    const signMat=new THREE.MeshStandardMaterial({map:nameAtlas.texture,roughness:.5,emissive:'#ffffff',emissiveMap:nameAtlas.texture,emissiveIntensity:.18});
    const tileMat=new THREE.MeshStandardMaterial({map:tileAtlas.texture,roughness:.4,emissive:'#ffffff',emissiveMap:tileAtlas.texture,emissiveIntensity:.35});
    const signs=new Batch(),awnings=new Batch();
    const styleFor=i=>['deco','glass','brick','deco','concrete','glass','deco','glass','brick','glass','deco','concrete','glass','brick','concrete','deco','glass','brick','concrete','deco','glass','deco'][i%22];
    buildings.forEach((b,i)=>{const style=styleFor(i),pal=tints[style],color=pal[i%pal.length],floors=floorsFor(b);
      const rt=addBuilding(b.x,b.y,b.w,b.h,floors,style,color);
      // street-facing sides get a name sign and an awning
      const facing=[{side:'s',z:b.y+b.h,mid:b.x+b.w/2,len:b.w,road:ROAD_Y.some(y=>y>b.y+b.h&&y-(b.y+b.h)<140)},{side:'n',z:b.y,mid:b.x+b.w/2,len:b.w,road:ROAD_Y.some(y=>y<b.y&&b.y-y<140)},
        {side:'e',x:b.x+b.w,mid:b.y+b.h/2,len:b.h,road:ROAD_X.some(x=>x>b.x+b.w&&x-(b.x+b.w)<140)},{side:'w',x:b.x,mid:b.y+b.h/2,len:b.h,road:ROAD_X.some(x=>x<b.x&&b.x-x<140)}];
      const slot=nameAtlas.uv(i),sw=Math.min(b.w,b.h,230)*.82,sh=sw/8,y=CURB+GROUND-11,ac=awn[i%awn.length];
      for(const f of facing){if(!f.road)continue;const ry={s:0,n:Math.PI,e:Math.PI/2,w:-Math.PI/2}[f.side],off=.8;
        const px=f.side==='e'?f.x+off:f.side==='w'?f.x-off:f.mid,pz=f.side==='s'?f.z+off:f.side==='n'?f.z-off:f.mid;signs.add(signMat,signQuad(Math.min(sw,f.len*.8),Math.min(sh,12),px,y,pz,ry,slot));
        const aw=new THREE.BoxGeometry(f.len*.86,1.2,11);aw.rotateX(.32);aw.translate(0,CURB+GROUND-26,5.5);aw.rotateY(ry);aw.translate(f.side==='e'?f.x:f.side==='w'?f.x:f.mid,0,f.side==='s'?f.z:f.side==='n'?f.z:f.mid);tint(aw,ac);awnings.add(awningMat,aw)}
      // rooftop periodic-table tile (navigation landmark)
      const t=tileAtlas.uv(i),cx=b.x+b.w/2,cz=b.y+b.h/2,ts=Math.min(46,b.w*.35);
      signs.add(tileMat,signQuad(ts,ts,cx,rt+ts/2+8,cz+2.2,0,t));signs.add(tileMat,signQuad(ts,ts,cx,rt+ts/2+8,cz-2.2,Math.PI,t));
      props.box(dark,ts+4,ts+4,4,cx,rt+ts/2+8,cz);props.box(dark,3,8,3,cx-ts/3,rt+4,cz);props.box(dark,3,8,3,cx+ts/3,rt+4,cz);
      if(b.name==='TRANSITION TOWER'){const pad=new THREE.CylinderGeometry(34,34,2,24);pad.translate(b.x+b.w/2,rt+12,b.y+b.h/2+70);props.add(trim,pad);props.box(dark,3,120,3,b.x+30,rt+60,b.y+30)}
    });
    // Visual-only outer city ring: dense towers beyond the playable boundary.
    const inPlay=(x0,z0,x1,z1)=>x1>0&&x0<2262&&z1>0&&z0<1800;
    for(const blk of this.blocks){if(blk.x1-blk.x0<80||blk.z1-blk.z0<80)continue;
      let {x0,x1,z0,z1}=blk;if(inPlay(x0,z0,x1,z1)){if(z0<0&&z1>0)z1=-12;else if(z1>1800&&z0<1800)z0=1812;else if(x0<0&&x1>0)x1=-12;else continue}
      if(x1-x0<70||z1-z0<70)continue;const nx=Math.max(1,Math.round((x1-x0-40)/230)),nz=Math.max(1,Math.round((z1-z0-40)/230)),lw=(x1-x0-40)/nx,ld=(z1-z0-40)/nz;
      const dToPlay=Math.hypot(Math.max(0,-((x0+x1)/2)),Math.max(0,(z0+z1)/2-1800,-((z0+z1)/2)));
      for(let a=0;a<nx;a++)for(let c=0;c<nz;c++){const st=STYLES[Math.floor(r()*4)],pal=tints[st];const fl=Math.round(5+r()*(dToPlay<1500?24:14));
        addBuilding(x0+20+a*lw+6,z0+20+c*ld+6,lw-12,ld-12,fl,st,pal[Math.floor(r()*pal.length)],{storefront:fl<14,parapet:true,detail:r()>.5})}}
    sides.build(this.scene);props.build(this.scene);signs.build(this.scene,{cast:false});awnings.build(this.scene,{cast:true});
    this.disposables.push(nameAtlas.texture,tileAtlas.texture);
    this.buildContactShade(feet);
    for(const m of Object.values(facades))this.nightMats.push([m,0,1.25]);this.nightMats.push([store,0,.42],[signMat,.18,.7],[tileMat,.35,.6]);
  }
  /** Baked contact shading: a soft dark band hugging the base of every wall (one draw call, no AO pass). */
  buildContactShade(feet){const W=16,y=CURB+.06,pos=[],uv=[];
    const tex=canvasTexture(4,64,(c,w,h)=>{const g=c.createLinearGradient(0,h,0,0);g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(.45,'rgba(0,0,0,.14)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},{srgb:false});
    const flat=(px,pz)=>groundHeight(px,pz)===CURB&&!circleCollides(px,pz,1);
    for(const [x,z,w,d] of feet){const c=[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
      const cx=x+w/2,cz=z+d/2,out=([px,pz])=>[px+Math.sign(px-cx)*W,pz+Math.sign(pz-cz)*W];
      for(let k=0;k<4;k++){const [ax,az]=c[k],[bx,bz]=c[(k+1)%4],[oax,oaz]=out(c[k]),[obx,obz]=out(c[(k+1)%4]);
        if(!flat((oax+obx)/2,(oaz+obz)/2))continue;
        pos.push(ax,y,az,bx,y,bz,obx,y,obz, ax,y,az,obx,y,obz,oax,y,oaz);uv.push(0,0,1,0,1,1, 0,0,1,1,0,1)}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const m=this.contactShade=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,toneMapped:false}));
    m.matrixAutoUpdate=false;m.renderOrder=1;this.scene.add(m);
  }
  buildWater(){
    const water=this.water=new THREE.Mesh(new THREE.PlaneGeometry(24000,26000),waterMaterial(this.sunDir));water.rotation.x=-Math.PI/2;water.position.set(SEA_X+12000,-.6,900);this.scene.add(water);
    const b=new Batch(),con=new THREE.MeshStandardMaterial({color:'#b9b4a6',roughness:.9}),wood=new THREE.MeshStandardMaterial({color:'#8a6a4a',roughness:.85}),rail=new THREE.MeshStandardMaterial({color:'#e8e8e2',roughness:.5,metalness:.4});
    b.box(con,15,10,EXT.maxY-EXT.minY,SEA_X-7.5,-1,(EXT.minY+EXT.maxY)/2);
    for(let z=EXT.minY;z<EXT.maxY;z+=30)b.box(rail,1.4,9,1.4,SEA_X-2,CURB+4.5,z);b.box(rail,1.2,1.2,EXT.maxY-EXT.minY,SEA_X-2,CURB+9,(EXT.minY+EXT.maxY)/2);
    for(const z of [460,900,1430]){b.box(wood,360,3,26,SEA_X+180,CURB+.5,z+12);for(let x=SEA_X+20;x<SEA_X+360;x+=40)for(const dz of [0,24])b.box(wood,3,14,3,x,-5,z+dz)}
    b.build(this.scene);
    // boats & lighthouse (static meshes with a gentle bob in render)
    this.boats=[];const hull=new THREE.MeshStandardMaterial({color:'#f2f2ee',roughness:.4}),blue=new THREE.MeshStandardMaterial({color:'#1f4e79',roughness:.5}),sail=new THREE.MeshStandardMaterial({color:'#fbfaf5',roughness:.8,side:THREE.DoubleSide});
    const boat=(x,z,len,kind)=>{const g=new THREE.Group();const h=new THREE.Mesh(new THREE.CylinderGeometry(len*.18,len*.12,len,10,1),hull);h.rotation.z=Math.PI/2;h.scale.set(1,1,.5);h.position.y=3;g.add(h);
      const deck=new THREE.Mesh(new THREE.BoxGeometry(len*.45,6,len*.16),kind==='sail'?hull:blue);deck.position.set(-len*.05,8,0);g.add(deck);
      if(kind==='sail'){const mast=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,len*1.2,6),rail);mast.position.y=len*.6;g.add(mast);const s=new THREE.BufferGeometry();s.setAttribute('position',new THREE.Float32BufferAttribute([0,len*.15,0,0,len*1.15,0,-len*.42,len*.15,0],3));s.computeVertexNormals();g.add(new THREE.Mesh(s,sail))}
      g.position.set(x,0,z);g.rotation.y=Math.random()*.6-.3;g.traverse(o=>{if(o.isMesh)o.castShadow=true});this.scene.add(g);this.boats.push({g,phase:x*.01+z*.02})};
    boat(2440,500,60,'sail');boat(2520,870,48,'motor');boat(2480,1470,64,'sail');boat(3300,300,90,'motor');boat(4200,1600,70,'sail');boat(6800,-400,380,'motor');
    const lh=new THREE.Group();const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(120,0),new THREE.MeshStandardMaterial({color:'#6e6a60',roughness:1}));rock.scale.set(1.4,.35,1.1);lh.add(rock);
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(14,20,170,16),new THREE.MeshStandardMaterial({color:'#f4f1ea',roughness:.6}));tower.position.y=110;lh.add(tower);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(15.5,17,26,16),new THREE.MeshStandardMaterial({color:'#b5322d',roughness:.6}));band.position.y=150;lh.add(band);
    const lamp=new THREE.Mesh(new THREE.CylinderGeometry(10,10,16,12),new THREE.MeshStandardMaterial({color:'#fff3c4',emissive:'#ffe7a0',emissiveIntensity:1.2}));lamp.position.y=205;lh.add(lamp);
    lh.position.set(4600,0,-700);this.scene.add(lh);
  }
  buildProps(){
    const metal=new THREE.MeshStandardMaterial({color:'#3c4246',roughness:.5,metalness:.6}),lens=new THREE.MeshBasicMaterial({color:'#ffffff'});
    const avoid=(x,z,r)=>circleCollides(x,z,r)||stations.some(s=>Math.hypot(s.x-x,s.y-z)<80)||POWER_POINTS.some(p=>Math.hypot(p.x-x,p.y-z)<60)||[...READINGS,...RELAYS].some(m=>Math.hypot(m.x-x,m.y-z)<50)||Math.hypot(x-580,z-1025)<60;
    // street lights (instanced)
    const pole=new THREE.CylinderGeometry(.9,1.3,78,7);pole.translate(0,39,0);const arm=new THREE.BoxGeometry(22,1.4,1.4);arm.translate(-10,77,0);const head=new THREE.BoxGeometry(9,2.2,4.4);head.translate(-20,76,0);
    const lightGeo=mergeGeometries([pole,arm,head]),lensGeo=new THREE.BoxGeometry(7,.6,3.4);lensGeo.translate(-20,74.8,0);
    const spots=[];
    for(const x of RX_ALL)for(let z=EXT.minY+60;z<EXT.maxY;z+=200){if(RY_ALL.some(y=>Math.abs(y-z)<110))continue;const side=(Math.round(z/200)%2)?1:-1;spots.push([x+side*64,z,side>0?0:Math.PI])} // arm over the road (as on the cross streets)
    for(const z of RY_ALL)for(let x=EXT.minX+60;x<SEA_X-30;x+=200){if(RX_ALL.some(v=>Math.abs(v-x)<110))continue;const side=(Math.round(x/200)%2)?1:-1;spots.push([x,z+side*64,side>0?-Math.PI/2:Math.PI/2])}
    const lights=spots.filter(([x,z])=>!(x>0&&x<2262&&z>0&&z<1800&&avoid(x,z,2))&&Math.hypot(x-1200,z-900)<3600);
    const poles=new THREE.InstancedMesh(lightGeo,metal,lights.length),lenses=new THREE.InstancedMesh(lensGeo,lens,lights.length),o=new THREE.Object3D();
    this.lampHeads=[];this.lenses=lenses;
    lights.forEach(([x,z,ry],i)=>{o.position.set(x,CURB,z);o.rotation.set(0,ry,0);o.updateMatrix();poles.setMatrixAt(i,o.matrix);lenses.setMatrixAt(i,o.matrix);lenses.setColorAt(i,LENS_DAY);this.lampHeads.push(new THREE.Vector3(-20,73,0).applyMatrix4(o.matrix))});poles.castShadow=true;this.scene.add(poles,lenses);
    // traffic signals: two corner poles per play intersection; lamps grouped by direction
    const housing=new Batch(),lamp=k=>new THREE.MeshStandardMaterial({color:'#1b1b1b',emissive:k,emissiveIntensity:0,roughness:.3});
    this.signal={ns:{r:lamp('#ff2a1a'),a:lamp('#ffb31a'),g:lamp('#2aff7a')},ew:{r:lamp('#ff2a1a'),a:lamp('#ffb31a'),g:lamp('#2aff7a')}};const lamps=new Batch();
    for(const x of ROAD_X)for(const z of ROAD_Y)for(const [sx,sz] of [[-1,-1],[1,1]]){const px=x+sx*70,pz=z+sz*70;housing.box(metal,2.2,70,2.2,px,CURB+35,pz);
      // arm over the road carrying a head for N-S traffic, and a pole head for E-W traffic
      housing.box(metal,96,1.6,1.6,px-sx*48,CURB+66,pz);const hx=px-sx*90,hz=pz;housing.box(metal,4,11,4,hx,CURB+60,hz);
      for(const [k,dy] of [['r',3.4],['a',0],['g',-3.4]]){const s=new THREE.SphereGeometry(1.4,8,6);s.translate(hx,CURB+60+dy,hz-sz*2.2);lamps.add(this.signal.ns[k],s)}
      housing.box(metal,4,11,4,px,CURB+52,pz-sz*3);for(const [k,dy] of [['r',3.4],['a',0],['g',-3.4]]){const s=new THREE.SphereGeometry(1.4,8,6);s.translate(px-sx*2.2,CURB+52+dy,pz-sz*3);lamps.add(this.signal.ew[k],s)}
      // street-name sign
    }
    housing.build(this.scene);lamps.build(this.scene,{cast:false});
    const streetAtlas=textAtlas(Object.values(STREET_NAMES),{cols:2,slotW:256,slotH:48,draw:(c,t,w,h)=>{c.fillStyle='#1d6b3a';c.fillRect(0,0,w,h);c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(3,3,w-6,h-6);c.fillStyle='#fff';c.font='800 26px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t,w/2,h/2+1,w-16)}});
    const streetMat=new THREE.MeshStandardMaterial({map:streetAtlas.texture,roughness:.5,side:THREE.DoubleSide}),ss=new Batch(),keys=Object.keys(STREET_NAMES);
    for(const x of ROAD_X)for(const z of ROAD_Y){const px=x-70,pz=z-70;ss.add(streetMat,signQuad(30,5.6,px,CURB+74,pz,Math.PI/2,streetAtlas.uv(keys.indexOf('x'+x))));ss.add(streetMat,signQuad(30,5.6,px,CURB+80,pz,0,streetAtlas.uv(keys.indexOf('y'+z))))}
    ss.build(this.scene,{cast:false});
    // palms and shade trees (instanced)
    const palm=palmGeometries(),tree=treeGeometries(),pr=rng(808),palms=[],trees=[];
    for(const x of ROAD_X)for(let z=80;z<1760;z+=190)for(const side of [-1,1]){const px=x+side*(98+pr()*6),pz=z+pr()*30;if(!avoid(px,pz,10)&&!ROAD_Y.some(y=>Math.abs(y-pz)<100))palms.push([px,pz])}
    for(const z of ROAD_Y)for(let x=70;x<2230;x+=190)for(const side of [-1,1]){const px=x+pr()*30,pz=z+side*(98+pr()*6);if(!avoid(px,pz,10)&&!ROAD_X.some(v=>Math.abs(v-px)<100))palms.push([px,pz])}
    const outer=[];for(const x of [-300,-1050])for(let z=-1500;z<3400;z+=330)for(const side of [-1,1])outer.push([x+side*96,z]);
    for(const z of [-350,2250])for(let x=-2400;x<2200;x+=330)for(const side of [-1,1])outer.push([x,z+side*96]);
    for(let i=0;i<70;i++){const x=60+pr()*2160,z=90+pr()*1650;if(!avoid(x,z,26)&&!ROAD_X.some(v=>Math.abs(v-x)<100)&&!ROAD_Y.some(v=>Math.abs(v-z)<100))trees.push([x,z])}
    const leaf=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.8,side:THREE.DoubleSide}),bark=new THREE.MeshStandardMaterial({color:'#7a6650',roughness:.95}),nut=new THREE.MeshStandardMaterial({color:'#5a3f22',roughness:.8}),crownMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.9,flatShading:true});
    // gentle wind sway in the vertex shader (amplitude 0 with reduced motion or on the low preset)
    const wind=this.wind={uTime:{value:0},uAmp:{value:1}},sway=(weight)=>shader=>{shader.uniforms.uWindTime=wind.uTime;shader.uniforms.uWindAmp=wind.uAmp;
      shader.vertexShader=shader.vertexShader.replace('void main() {','uniform float uWindTime,uWindAmp;\nvoid main() {').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n{float sw=sin(uWindTime*1.3+instanceMatrix[3].x*.013+instanceMatrix[3].z*.017)*('+weight+')*uWindAmp;transformed.x+=sw*1.8;transformed.z+=sw*1.1;}\n#endif')};
    leaf.onBeforeCompile=sway('clamp(length(position.xz-vec2(14.,0.))/40.,0.,1.)');crownMat.onBeforeCompile=sway('smoothstep(30.,70.,position.y)*.7');leaf.customProgramCacheKey=()=>'sway-palm';crownMat.customProgramCacheKey=()=>'sway-tree';
    const leafBase=new THREE.Color('#4f8a3c'),treeBase=new THREE.Color('#5d8f45'),jit=new THREE.Color();
    const inst=(geo,mat,list,ys,cast=true,base=null)=>{const m=new THREE.InstancedMesh(geo,mat,list.length);list.forEach(([x,z],i)=>{o.position.set(x,ys,z);o.rotation.set(0,(x*7.3+z*3.1)%6.28,0);o.scale.setScalar(.82+((x*13+z*7)%100)/100*.38);o.updateMatrix();m.setMatrixAt(i,o.matrix);
      if(base)m.setColorAt(i,jit.copy(base).offsetHSL((hash01(x+z*3)-.5)*.06,0,(hash01(x*7-z)-.5)*.12))});m.castShadow=cast;this.scene.add(m);return m};
    inst(palm.trunk,bark,palms,CURB);inst(palm.crown,leaf,palms,CURB,true,leafBase);inst(palm.nuts,nut,palms,CURB,false);inst(palm.trunk,bark,outer,CURB,false);inst(palm.crown,leaf,outer,CURB,false,leafBase);inst(tree.trunk,bark,trees,CURB);inst(tree.crown,crownMat,trees,CURB,true,treeBase);
    // boundary hedges and road-closed barriers (the edge of the playable district)
    const hedge=new THREE.MeshStandardMaterial({color:'#3f6b34',roughness:1}),bar=new Batch();
    const crossing=(a,list)=>list.some(v=>Math.abs(v-a)<64);
    for(let x=20;x<2250;x+=40){if(!crossing(x,ROAD_X)){bar.box(hedge,40,9,8,x+20,CURB+4.5,44);bar.box(hedge,40,9,8,x+20,CURB+4.5,1782)}}
    for(let z=40;z<1790;z+=40){if(!crossing(z,ROAD_Y))bar.box(hedge,8,9,40,16,CURB+4.5,z+20)}
    const stripeA=new THREE.MeshStandardMaterial({color:'#f2f2ee',roughness:.6}),stripeB=new THREE.MeshStandardMaterial({color:'#e8641c',roughness:.6});
    const barrier=(x,z,alongX)=>{for(let k=-54;k<=50;k+=10){const bx=alongX?x+k:x,bz=alongX?z:z+k;bar.box((Math.round(k/10)%2)?stripeA:stripeB,alongX?10:4,8,alongX?4:10,bx+(alongX?5:0),.25+6,bz+(alongX?0:5));bar.box(stripeA,alongX?10:4.6,4,alongX?4.6:10,bx+(alongX?5:0),.25+2,bz+(alongX?0:5))}};
    for(const x of ROAD_X){barrier(x,46,true);barrier(x,1780,true)}for(const z of ROAD_Y)barrier(18,z,false);
    bar.build(this.scene);
    // bus shelter + benches near HQ
    const glass=new THREE.MeshStandardMaterial({color:'#bfe3ef',transparent:true,opacity:.35,roughness:.05,metalness:.2}),sb=new Batch();
    sb.box(metal,16,1.6,60,352,CURB+28,1060);sb.box(glass,.6,24,60,344,CURB+14,1060);sb.box(metal,1.6,28,1.6,359,CURB+14,1031);sb.box(metal,1.6,28,1.6,359,CURB+14,1089);
    sb.box(new THREE.MeshStandardMaterial({color:'#b98b5a',roughness:.8}),6,1.6,40,348,CURB+7,1060);
    for(const [x,z] of [[760,1325],[1385,1365],[1060,760],[1700,1000]]){sb.box(new THREE.MeshStandardMaterial({color:'#9c7a52',roughness:.8}),30,1.8,8,x,CURB+7,z);sb.box(metal,2,7,7,x-12,CURB+3.5,z);sb.box(metal,2,7,7,x+12,CURB+3.5,z)}
    sb.build(this.scene);
    // rooftop billboards with original chemistry adverts
    const ads=[['NOBLE NEON','Group 18 glows when current flows','#ff4fa3','#1a0b2a'],['COPPER CONNECTS','Conductive · ductile · ready to bend','#e08a4a','#10262c'],['SALT, SIMPLIFIED','NaCl = 1 Na⁺ : 1 Cl⁻','#5fd3ff','#0d1f33'],['RIDE THE PERIODIC LINE','Element City Transit','#ffd24a','#102a1d']];
    const adAtlas=textAtlas(ads,{cols:2,slotW:512,slotH:256,draw:(c,[t,s,col,bg],w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,bg);g.addColorStop(1,'#000');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle=col;c.fillRect(0,h-26,w,26);
      c.font='900 58px system-ui,sans-serif';c.fillStyle='#fff';c.textAlign='left';c.fillText(t,28,110,w-50);c.font='600 28px system-ui,sans-serif';c.fillStyle=col;c.fillText(s,30,165,w-50)}});
    const adMat=new THREE.MeshStandardMaterial({map:adAtlas.texture,emissive:'#ffffff',emissiveMap:adAtlas.texture,emissiveIntensity:.45,roughness:.5}),ab=new Batch();
    [[3,0],[9,1],[11,2],[16,3]].forEach(([bi,ai])=>{const b=buildings[bi],rt=CURB+buildingHeight(b);const w=Math.min(110,b.w*.7),h=w/2;ab.add(adMat,signQuad(w,h,b.x+b.w/2,rt+h/2+14,b.y+b.h-8,0,adAtlas.uv(ai)));ab.box(metal,w,h,2,b.x+b.w/2,rt+h/2+14,b.y+b.h-9.2);ab.box(metal,2,14,2,b.x+b.w/2-w/3,rt+7,b.y+b.h-10);ab.box(metal,2,14,2,b.x+b.w/2+w/3,rt+7,b.y+b.h-10)});
    ab.build(this.scene,{cast:false});this.nightMats.push([adMat,.45,1.1]);
    this.disposables.push(streetAtlas.texture,adAtlas.texture);
  }
  buildMarkers(){
    for(const s of stations){const g=new THREE.Group();g.position.set(s.x,groundHeight(s.x,s.y)+.4,s.y);this.scene.add(g);
      const ring=new THREE.Mesh(new THREE.RingGeometry(19,23,48),new THREE.MeshBasicMaterial({color:s.color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;g.add(ring);
      const disc=new THREE.Mesh(new THREE.CircleGeometry(19,40),new THREE.MeshBasicMaterial({color:s.color,transparent:true,opacity:.16,depthWrite:false,fog:false,toneMapped:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.05;g.add(disc);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(14,17,s.id==='hq'?140:420,28,1,true),beamMaterial(s.color));beam.position.y=(s.id==='hq'?140:420)/2;g.add(beam);
      const icon=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTexture(s.code,s.color,false),transparent:true,depthWrite:false,fog:false,toneMapped:false}));icon.scale.set(18,18,1);icon.position.y=48;g.add(icon);
      const text=spriteLabel(s.id==='hq'?'RESEARCH HQ':s.name.toUpperCase(),s.color);text.position.y=74;g.add(text);
      this.markerGroups.set(s.id,{group:g,ring,disc,beam,icon,text,done:null})}
    this.refreshProgress();
  }
  buildWorkshop(){
    this.workshop=new THREE.Group();this.workshopTargets=[];this.sampleModels=new Map();this.socketModels=new Map();this.scene.add(this.workshop);
    const steel=new THREE.MeshStandardMaterial({color:'#9aa3a8',metalness:.7,roughness:.35}),cab=new THREE.MeshStandardMaterial({color:'#5b6a70',metalness:.3,roughness:.6}),top=new THREE.MeshStandardMaterial({color:'#e9ecec',roughness:.5});
    for(const point of POWER_POINTS){const group=new THREE.Group(),y=groundHeight(point.x,point.y);group.position.set(point.x,y,point.y);group.userData.pointId=point.id;this.workshop.add(group);this.workshopTargets.push(group);
      const ring=new THREE.Mesh(new THREE.RingGeometry(24,26.5,40),new THREE.MeshBasicMaterial({color:'#ffc46a',side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.3;group.add(ring);(this.workshopRings||=new Map()).set(point.id,ring);
      const mk=(geo,mat,x,yy,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,yy,z);m.castShadow=true;group.add(m);return m};
      if(point.kind==='sample'){for(const [dx,dz] of [[-14,-8],[14,-8],[-14,8],[14,8]])mk(new THREE.CylinderGeometry(.8,.8,13,6),steel,dx,6.5,dz);mk(new THREE.BoxGeometry(34,1.6,22),top,0,13.5,0);mk(new THREE.BoxGeometry(30,1,18),cab,0,4,0);
        const paint=new THREE.MeshStandardMaterial({color:{copper:'#c4733f',graphite:'#3b3f42',sulfur:'#e2c445',silicon:'#7d8790'}[point.material],metalness:{copper:.85,silicon:.6}[point.material]||0,roughness:{copper:.3,silicon:.35}[point.material]||.75});
        const parts=[mk(new THREE.BoxGeometry(10,1.6,3.4),paint,-5.5,15.2,0),mk(new THREE.BoxGeometry(10,1.6,3.4),paint,5.5,15.2,0)];
        const light=mk(new THREE.BoxGeometry(5,3,2),new THREE.MeshStandardMaterial({color:'#dca768',emissive:'#dca768',emissiveIntensity:.6}),0,15.8,9);
        this.sampleModels.set(point.material,{parts,light});const sign=spriteLabel(point.material.toUpperCase(),'#ffc46a',undefined,150);sign.position.y=34;group.add(sign);(this.workshopLabels||=[]).push({sign,point})}
      else{mk(new THREE.BoxGeometry(18,26,12),cab,0,13,0);const socket=mk(new THREE.BoxGeometry(9,9,1.6),new THREE.MeshStandardMaterial({color:'#dca768',emissive:'#7d4b20',emissiveIntensity:.5}),0,17,6.6);
        this.socketModels.set(point.id,socket);const sign=spriteLabel(point.id==='socket-a'?'A · CABINET':'B · SIGNAL','#ffc46a',undefined,160);sign.position.y=38;group.add(sign);(this.workshopLabels||=[]).push({sign,point})}}
    const a=POWER_POINTS.find(p=>p.id==='socket-a'),b=POWER_POINTS.find(p=>p.id==='socket-b');
    this.cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(a.x,19,a.y+7),new THREE.Vector3(a.x+20,CURB+1.5,a.y+16),new THREE.Vector3(b.x-20,CURB+1.5,b.y+16),new THREE.Vector3(b.x,19,b.y+7)]);
    this.cable=new THREE.Mesh(new THREE.TubeGeometry(this.cableCurve,28,1.1,6,false),new THREE.MeshStandardMaterial({color:'#b97545',metalness:.6,roughness:.4}));this.workshop.add(this.cable);
    this.currentBeads=[];const beadMat=new THREE.MeshStandardMaterial({color:'#a0ffe5',emissive:'#72e3c1',emissiveIntensity:1.4});
    for(let i=0;i<5;i++){const bead=new THREE.Mesh(new THREE.SphereGeometry(1.8,8,6),beadMat);this.workshop.add(bead);this.currentBeads.push(bead)}
    // "go here next" arrow (bobs over the station the step strip names)
    this.workArrow=new THREE.Mesh(new THREE.ConeGeometry(9,17,4),new THREE.MeshBasicMaterial({color:'#ffc46a',toneMapped:false}));this.workArrow.rotation.x=Math.PI;this.workArrow.visible=false;this.workshop.add(this.workArrow);
    // a cable that trails from terminal A to the sample in your hand until terminal B is connected
    this.trailSegs=18;this.trail=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.1,1.1,1,6,1,true),new THREE.MeshStandardMaterial({color:'#b97545',metalness:.6,roughness:.4}),this.trailSegs);
    this.trail.frustumCulled=false;this.trail.visible=false;this.workshop.add(this.trail);
    this.trailCurve=new THREE.CatmullRomCurve3([0,1,2,3].map(()=>new THREE.Vector3()),false,'centripetal');this.trailPts=Array.from({length:this.trailSegs+1},()=>new THREE.Vector3());
  }
  /** Per frame: glow the station(s) for the current step, bob the arrow, and drape the trailing cable. */
  updateWorkshopGuide(t,reduced){if(!this.workshopRings)return;const work=this.config.powerState||{},p=this.player,on=!!work.enabled&&!this.config.completed?.includes('power');
    const st=on?powerStep(work,p):null,hi=new Set(st?.highlight||[]),pulse=reduced?1.1:1.1+Math.sin(t*4)*.09;
    for(const [id,ring] of this.workshopRings){const pt=POWER_POINTS.find(q=>q.id===id),lit=hi.has(id),ok=pt.kind==='sample'?benchDone(work,pt.material):work.connections?.includes(id.at(-1));
      ring.visible=on;ring.material.color.set(lit?'#ffc46a':ok?'#3fd6a5':'#8a8f94');ring.material.opacity=lit?.95:.5;ring.scale.setScalar(lit?pulse:1)}
    const a=st?.arrow&&!p.inVehicle?POWER_POINTS.find(q=>q.id===st.arrow):null;this.workArrow.visible=!!a;
    if(a){this.workArrow.position.set(a.x,groundHeight(a.x,a.y)+(a.kind==='sample'?54:58)+(reduced?0:Math.sin(t*3)*3),a.y);this.workArrow.rotation.y=reduced?0:t*1.4}
    const A=POWER_POINTS.find(q=>q.id==='socket-a'),trail=on&&!p.inVehicle&&cableState(work)==='trailing'&&Math.hypot(p.x-A.x,p.y-A.y)<450;this.trail.visible=trail;if(!trail)return;
    this.trail.material.color.set({copper:'#b97545',graphite:'#3d4245',sulfur:'#d9c04a',silicon:'#7d8790'}[work.material]||'#b97545');
    const hand=this.carriedSample.getWorldPosition(this.trailHand||(this.trailHand=new THREE.Vector3())),[c0,c1,c2,c3]=this.trailCurve.points,dx=hand.x-A.x,dz=hand.z-(A.y+7),d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
    c0.set(A.x,groundHeight(A.x,A.y)+17,A.y+7);c3.copy(hand);
    if(d<40){c1.lerpVectors(c0,c3,1/3);c2.lerpVectors(c0,c3,2/3)}else{const k=Math.min(14,d*.25);c1.set(A.x+ux*k,groundHeight(A.x+ux*k,A.y+7+uz*k)+1.3,A.y+7+uz*k);c2.set(hand.x-ux*k,groundHeight(hand.x-ux*k,hand.z-uz*k)+1.3,hand.z-uz*k)}
    const P=this.trailPts,m=this.trailM||(this.trailM=new THREE.Matrix4()),q=this.trailQ||(this.trailQ=new THREE.Quaternion()),up=this.trailUp||(this.trailUp=new THREE.Vector3(0,1,0)),dir=this.trailDir||(this.trailDir=new THREE.Vector3()),mid=this.trailMid||(this.trailMid=new THREE.Vector3()),sc=this.trailSc||(this.trailSc=new THREE.Vector3());
    for(let i=0;i<=this.trailSegs;i++)this.trailCurve.getPoint(i/this.trailSegs,P[i]);
    for(let i=0;i<this.trailSegs;i++){dir.subVectors(P[i+1],P[i]);const len=dir.length()||.001;dir.multiplyScalar(1/len);q.setFromUnitVectors(up,dir);mid.addVectors(P[i],P[i+1]).multiplyScalar(.5);sc.set(1,len+.6,1);m.compose(mid,q,sc);this.trail.setMatrixAt(i,m)}
    this.trail.instanceMatrix.needsUpdate=true}
  updateWorkshop(){const work=this.config.powerState||{},done=this.config.completed?.includes('power');
    for(const [id,m] of this.sampleModels){const scanned=work.measurements?.[id]||[],last=work.lastTest;
      m.light.material.color.set(scanned.length>=3?'#77e5c1':'#dca768');m.light.material.emissive.set(scanned.length>=3?'#3fd6a5':'#dca768');
      const failedFlex=last?.material===id&&last?.test==='bend'&&id!=='copper',compressed=false,flex=last?.material===id&&last?.test==='bend';
      m.parts[1].position.x=failedFlex||compressed&&id!=='copper'?9:5.5;m.parts[1].rotation.z=failedFlex?-.35:flex&&id==='copper'?.2:0;
      for(const part of m.parts){part.scale.y=compressed&&id==='copper'?.4:1;part.scale.z=compressed&&id==='copper'?1.8:1}
      if(last?.material===id&&last?.test==='conduct'){m.light.material.color.set(id==='sulfur'?'#6a6f73':id==='silicon'?'#c9b46a':'#7ce7c8');m.light.material.emissive.set(id==='sulfur'?'#222':id==='silicon'?'#5a4a1a':'#3fd6a5')}}
    for(const [id,m] of this.socketModels){const on=done||work.connections?.includes(id.at(-1));m.material.color.set(on?'#78e3c1':'#dca768');m.material.emissive.set(on?'#2fbf8f':'#7d4b20')}
    this.cable.visible=cableState(work,done)==='full';const mat={copper:'#b97545',graphite:'#3d4245',sulfur:'#d9c04a',silicon:'#7d8790'}[work.material]||'#b97545';
    this.cable.material.color.set(done||work.success?'#c4733f':work.failed?'#9a4a3a':mat);
    }
  kiosk(x,y,id,screenMat){const metal=this.kioskMetal||(this.kioskMetal=new THREE.MeshStandardMaterial({color:'#2f3c44',metalness:.5,roughness:.45})),glass=this.kioskGlass||(this.kioskGlass=new THREE.MeshStandardMaterial({color:'#dff3ff',transparent:true,opacity:.35,roughness:.05}));
    const g=new THREE.Group();g.position.set(x,groundHeight(x,y),y);g.userData.pointId=id;this.scene.add(g);this.workshopTargets.push(g);
    const post=new THREE.Mesh(new THREE.BoxGeometry(8,22,10),metal);post.position.y=11;post.castShadow=true;g.add(post);
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(14,9),screenMat);scr.position.set(-4.2,24,0);scr.rotation.y=-Math.PI/2;g.add(scr);const frame=new THREE.Mesh(new THREE.BoxGeometry(1.5,10,15),metal);frame.position.set(-3.4,24,0);g.add(frame);
    const vial=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,10,12),glass);vial.position.set(0,27,6.5);g.add(vial);
    const liquid=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.8,6.5,12),new THREE.MeshStandardMaterial({color:'#a9c6d6',emissive:'#000000',roughness:.2,toneMapped:false}));liquid.position.set(0,25.5,6.5);g.add(liquid);
    const ring=new THREE.Mesh(new THREE.RingGeometry(16,18.5,40),new THREE.MeshBasicMaterial({color:'#5fd3ff',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.4;g.add(ring);
    return {g,liquid,ring}}
  buildSurvey(){this.surveyModels=new Map();
    const tex=canvasTexture(256,160,(c,w,h)=>{c.fillStyle='#0b2f45';c.fillRect(0,0,w,h);c.fillStyle='#5fd3ff';c.font='800 28px system-ui,sans-serif';c.textAlign='center';c.fillText('WATER MONITOR',w/2,46);c.font='600 19px system-ui,sans-serif';c.fillStyle='#cfefff';c.fillText('universal indicator',w/2,80);
      ['#d7263d','#f2a33a','#3fae49','#2f7fd1','#6a3bb5'].forEach((k,i)=>{c.fillStyle=k;c.fillRect(24+i*42,102,38,30)})});
    const mat=new THREE.MeshStandardMaterial({map:tex,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.5,toneMapped:false});
    for(const r of READINGS){const k=this.kiosk(r.x,r.y,'reading-'+r.sym,mat);const label=spriteLabel(r.sym+' · '+r.formula.replace(/(\d)/g,m=>'₀₁₂₃₄₅₆₇₈₉'[m]),'#5fd3ff',undefined,170);label.position.y=44;k.g.add(label);k.label=label;this.surveyModels.set(r.sym,{...k,color:uiOf(r.ui).color})}}
  buildRelays(){this.relayModels=new Map();const steel=new THREE.MeshStandardMaterial({color:'#8d969b',metalness:.7,roughness:.35});
    for(const t of RELAYS){const g=new THREE.Group();g.position.set(t.x,groundHeight(t.x,t.y),t.y);g.userData.pointId='relay-'+t.id;this.scene.add(g);this.workshopTargets.push(g);
      for(const [dx,dz] of [[-5,-5],[5,-5],[-5,5],[5,5]]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.7,1,150,6),steel);leg.position.set(dx*(1-.0),75,dz);leg.castShadow=true;g.add(leg)}
      for(let y=15;y<150;y+=22){const ring=new THREE.Mesh(new THREE.BoxGeometry(11,1,11),steel);ring.position.y=y;g.add(ring)}
      const dish=new THREE.Mesh(new THREE.SphereGeometry(9,14,8,0,Math.PI*2,0,Math.PI*.35),steel);dish.rotation.x=Math.PI/2.6;dish.position.set(0,128,6);g.add(dish);
      const beacon=new THREE.Mesh(new THREE.SphereGeometry(4,14,10),new THREE.MeshStandardMaterial({color:'#ffb455',emissive:'#ffb455',emissiveIntensity:1.6}));beacon.position.y=156;g.add(beacon);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(6,9,700,20,1,true),beamMaterial('#6ee7cf'));beam.position.y=156+350;beam.visible=false;g.add(beam);
      const ring=new THREE.Mesh(new THREE.RingGeometry(16,18.5,40),new THREE.MeshBasicMaterial({color:'#6ee7cf',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.4;g.add(ring);
      const label=spriteLabel(t.name.toUpperCase(),'#6ee7cf',undefined,150);label.position.y=60;g.add(label);
      this.relayModels.set(t.id,{g,beacon,beam,ring,label})}}
  buildGates(){const post=new THREE.MeshStandardMaterial({color:'#f4f1ea',roughness:.5}),glow=new THREE.MeshBasicMaterial({color:'#ffcc33',transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    this.gate={group:new THREE.Group(),arches:{}};this.scene.add(this.gate.group);this.gate.group.visible=false;
    for(const side of ['a','b']){const g=new THREE.Group();this.gate.group.add(g);
      for(const dz of [-27,27]){const p=new THREE.Mesh(new THREE.BoxGeometry(3,46,3),post);p.position.set(0,23,dz);p.castShadow=true;g.add(p)}
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
      const sign=new THREE.Mesh(new THREE.BoxGeometry(3,13,58),[new THREE.MeshStandardMaterial({map:tex,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.55}),new THREE.MeshStandardMaterial({map:tex,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.55}),post,post,post,post]);sign.position.y=50;g.add(sign);
      const band=new THREE.Mesh(new THREE.PlaneGeometry(6,56),glow);band.rotation.x=-Math.PI/2;band.position.y=.5;g.add(band);
      this.gate.arches[side]={g,canvas,tex}}}
  setGateLabels(a,b){for(const [side,text] of [['a',a],['b',b]]){const arch=this.gate.arches[side],c=arch.canvas.getContext('2d');c.fillStyle=side==='a'?'#14324a':'#3b1f4a';c.fillRect(0,0,512,128);c.strokeStyle='#ffcc33';c.lineWidth=8;c.strokeRect(4,4,504,120);
    c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';let size=64;c.font=`900 ${size}px system-ui,sans-serif`;while(c.measureText(text).width>470&&size>26){size-=4;c.font=`900 ${size}px system-ui,sans-serif`}c.fillText(text,256,68);arch.tex.needsUpdate=true}}
  placeGate(slot){const s=GATE_SLOTS[slot];if(!s){this.gate.group.visible=false;return}this.gate.group.visible=true;
    for(const [side,off] of [['a',-30],['b',30]]){const g=this.gate.arches[side].g;if(s.axis==='x'){g.position.set(s.x,.25,s.y+off);g.rotation.y=0}else{g.position.set(s.x+off,.25,s.y);g.rotation.y=Math.PI/2}}}
  /** Harbor fountain show. Each nozzle is real-looking water, not a solid shape: a thin glassy column that fades out at
   * the top, GPU-animated spray droplets that rise and fall back outward (a tapering plume with a falling skirt), foam
   * rings where the water lands, and a lit pool whose ring light shows the indicator color. */
  buildFountains(){this.fountain={group:new THREE.Group(),nozzles:[]};const f=this.fountain;f.group.position.set(2470,0,950);this.scene.add(f.group);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(70,6,300),new THREE.MeshStandardMaterial({color:'#39444b',roughness:.7}));deck.position.y=1;deck.castShadow=true;f.group.add(deck);
    const rim=new THREE.MeshStandardMaterial({color:'#c9d2d6',metalness:.6,roughness:.3});
    const SPRAY=760,seeds=new Float32Array(SPRAY*4),r=rng(91);
    for(let i=0;i<SPRAY;i++){seeds[i*4]=r();seeds[i*4+1]=r()*Math.PI*2;seeds[i*4+2]=.5+.5*Math.pow(r(),.6);seeds[i*4+3]=r()}
    const sprayGeo=new THREE.BufferGeometry();sprayGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(SPRAY*3),3));sprayGeo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,4));
    const coreGeo=new THREE.CylinderGeometry(1.2,3.2,1,18,1,true),splashGeo=new THREE.RingGeometry(2.5,22,48,1);
    const water='vec3 water(vec3 tint,float k){return mix(vec3(.9,.96,1.),tint,k);}';
    for(let i=0;i<4;i++){const z=-112+i*75,base=new THREE.Mesh(new THREE.CylinderGeometry(11,13,6,20),rim);base.position.set(0,5,z);f.group.add(base);
      const u={uTime:{value:0},uH:{value:1},uOn:{value:0},uTint:{value:new THREE.Color('#7d3cc8')},uScale:{value:400}};
      const pool=new THREE.Mesh(new THREE.CircleGeometry(10.3,28),new THREE.MeshStandardMaterial({color:'#2f7f9c',roughness:.12,metalness:.15,emissive:'#7d3cc8',emissiveIntensity:0}));pool.rotation.x=-Math.PI/2;pool.position.set(0,8.06,z);f.group.add(pool);
      const led=new THREE.Mesh(new THREE.TorusGeometry(10.5,.75,8,40),new THREE.MeshBasicMaterial({color:'#7d3cc8',toneMapped:false}));led.rotation.x=-Math.PI/2;led.position.set(0,8.1,z);led.visible=false;f.group.add(led);
      // glassy column: streaks run upward, edges catch the light, fades to nothing at the top (no cap)
      const core=new THREE.Mesh(coreGeo,new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false,
        vertexShader:'varying vec2 vUv;varying float vEdge;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);vEdge=1.-abs(dot(n,normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
        fragmentShader:`uniform float uTime,uOn;uniform vec3 uTint;varying vec2 vUv;varying float vEdge;${water}float h(float x){return fract(sin(x*127.1)*43758.5453);}
          void main(){float c=floor(vUv.x*22.),s=h(c);float streak=.5+.5*sin((vUv.y*5.-uTime*(2.6+1.8*s))*6.2831+s*6.2831);
          float a=(.12+.5*pow(vEdge,1.4)+.2*streak)*uOn*smoothstep(1.,.62,vUv.y)*smoothstep(0.,.05,vUv.y);gl_FragColor=vec4(water(uTint,.38),a);
          #include <colorspace_fragment>
          }`}));core.position.set(0,8,z);core.visible=false;f.group.add(core);
      // spray: each droplet flies on its own arc; rising ones hug the column, falling ones drift outward and fade
      const spray=new THREE.Points(sprayGeo,new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,fog:false,toneMapped:false,
        vertexShader:`uniform float uTime,uH,uOn,uScale;attribute vec4 aSeed;varying float vA;varying float vK;
          void main(){float g=260.,v0=sqrt(2.*g*max(uH,.5))*aSeed.z,tA=v0/g,life=2.*tA;float t=fract(uTime/max(life,.2)+aSeed.x)*life;
          float y=max(0.,v0*t-.5*g*t*t),fall=max(0.,t-tA);float drift=(4.+uH*.15)*(.5+aSeed.w);
          float rad=.35+.9*aSeed.w*min(1.,t*3.)+drift*fall;vec3 p=vec3(cos(aSeed.y)*rad,8.+y,sin(aSeed.y)*rad);
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float k=t/life;vK=k;
          vA=uOn*(fall>0.?.5*(1.-smoothstep(.72,1.,k)):.62)*(1.-.45*smoothstep(.8,1.,y/max(uH,1.)));
          gl_PointSize=uScale*(1.1+1.7*aSeed.w)*(fall>0.?1.25:1.)/max(1.,-mv.z);}`,
        fragmentShader:`uniform vec3 uTint;varying float vA;varying float vK;${water}
          void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;float a=smoothstep(.5,.08,d)*vA;gl_FragColor=vec4(water(uTint,.32+.2*vK),a);
          #include <colorspace_fragment>
          }`}));spray.position.set(0,0,z);spray.frustumCulled=false;spray.visible=false;f.group.add(spray);
      // foam where the water lands: rings ripple outward
      const splash=new THREE.Mesh(splashGeo,new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,side:THREE.DoubleSide,fog:false,toneMapped:false,
        vertexShader:'varying float vR;void main(){vR=length(position.xy)/22.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:`uniform float uTime,uOn;varying float vR;void main(){float w=.5+.5*sin(vR*30.-uTime*5.);float a=uOn*(1.-vR)*smoothstep(.1,.3,vR)*(.18+.4*w*w);gl_FragColor=vec4(vec3(.95,.98,1.),a);
          #include <colorspace_fragment>
          }`}));splash.rotation.x=-Math.PI/2;splash.position.set(0,8.2,z);splash.visible=false;f.group.add(splash);
      const label=spriteLabel('—','#bcacf4',undefined,230);label.position.set(0,30,z);label.visible=false;f.group.add(label);
      f.nozzles.push({z,u,core,spray,splash,pool,led,label,h:0,target:0,start:0})}}
  /** Run a fountain act: entries [{sym,h,color,text}] in the player's order. Calls done() when finished. */
  playShow(entries,done){const f=this.fountain;f.entries=entries;f.t0=this.clockLast;f.done=done;f.running=true;this.viewMode='show';this.snapCamera=true;
    f.nozzles.forEach((n,i)=>{const e=entries[i];n.target=e?e.h:0;n.h=0;n.start=i*1.1;n.label.visible=false;if(e){n.u.uTint.value.set(e.color);n.led.material.color.set(e.color);n.pool.material.emissive.set(e.color);n.label.material.map?.dispose();const sp=spriteLabel(`${i+1} · ${e.sym}`,'#bcacf4',undefined,230);n.label.material.map=sp.material.map;n.label.material.needsUpdate=true}});
    f.duration=1.1*entries.length+2.6;this.lastRender=0}
  resetShow(){const f=this.fountain;if(!f)return;f.running=false;f.nozzles.forEach(n=>{n.h=0;n.target=0;n.label.visible=false})}
  updateFountains(realDt,reduced){const f=this.fountain;if(!f)return;const el=f.running?(performance.now()-f.t0)/1000:0,secs=performance.now()/1000*(reduced?.4:1),scale=(this.height||600)*(this.dpr||1)*.5;
    const fin=!!this.finaleOn,ft=performance.now()/1000;
    f.nozzles.forEach((n,i)=>{const active=f.running?el>n.start:false;
      if(fin){n.h=reduced?.55:.45+.28*Math.sin(ft*1.1+i*1.3)+.1*Math.sin(ft*2.3+i);n.u.uTint.value.setHSL((ft*.04+i*.21)%1,.75,.6);n.led.material.color.copy(n.u.uTint.value);n.pool.material.emissive.copy(n.u.uTint.value)}
      else{const goal=active?n.target:(f.running?0:n.h);n.h+=(goal-n.h)*Math.min(1,realDt*(reduced?20:3))}const H=Math.max(.01,n.h*165),on=Math.min(1,n.h*40),show=n.h>.004;
      n.u.uTime.value=secs;n.u.uH.value=H;n.u.uOn.value=on;n.u.uScale.value=scale;n.core.visible=n.spray.visible=n.splash.visible=n.led.visible=show;
      n.core.scale.set(1,H*.9,1);n.core.position.y=8+H*.45;n.splash.scale.setScalar(.35+Math.min(1,H/110)*.75);n.pool.material.emissiveIntensity=on*.55;
      n.label.visible=!fin&&(f.running&&active||(!f.running&&n.target>0));n.label.position.y=8+H+18});
    if(f.running&&el>f.duration){f.running=false;const cb=f.done;f.done=null;this.viewMode='chase';this.snapCamera=true;cb?.()}}
  buildDropZones(){this.dropRings=new THREE.Group();this.scene.add(this.dropRings);this.dropRings.visible=false;const mat=new THREE.MeshBasicMaterial({color:'#ffc46a',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
    for(const d of DROP_ZONES){const r=new THREE.Mesh(new THREE.RingGeometry(13,16,32),mat);r.rotation.x=-Math.PI/2;r.position.set(d.x,groundHeight(d.x,d.y)+.45,d.y);this.dropRings.add(r)}}
  /** Element coins (one per group): one shared rim geometry and gold material, one symbol atlas texture;
   * each coin only adds a tiny face geometry. Coins further than 700 units away are not drawn. */
  buildSecrets(){this.secretModels=[];const coins=this.secretPoints||[];if(!coins.length)return;
    const atlas=textAtlas(coins,{cols:6,slotW:128,slotH:128,draw:(c,e,w,h)=>{const g=c.createRadialGradient(w*.4,h*.35,8,w/2,h/2,w*.6);g.addColorStop(0,'#fff2b0');g.addColorStop(1,'#e0b23c');c.fillStyle=g;c.fillRect(0,0,w,h);
      c.fillStyle='#4a3a10';c.textAlign='center';c.textBaseline='middle';c.font=`900 ${(e.symbol||'?').length>1?50:60}px system-ui,sans-serif`;c.fillText(e.symbol||'?',w/2,h/2+2);c.font='800 17px system-ui,sans-serif';c.fillText(e.group?'G'+e.group:'',w/2,h-20)}});
    const rim=new THREE.CylinderGeometry(9,9,1.8,6);rim.rotateX(Math.PI/2);
    const gold=new THREE.MeshStandardMaterial({color:'#ffd54f',metalness:.85,roughness:.25,emissive:'#5a4300',emissiveIntensity:.45});
    const faceMat=new THREE.MeshStandardMaterial({map:atlas.texture,emissive:'#ffffff',emissiveMap:atlas.texture,emissiveIntensity:.35,metalness:.3,roughness:.4});
    coins.forEach((s,i)=>{const slot=atlas.uv(i),faces=[];for(const back of [false,true]){const f=new THREE.CircleGeometry(8.3,6,Math.PI/6),uv=f.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,slot.u0+uv.getX(k)*(slot.u1-slot.u0),slot.v0+uv.getY(k)*(slot.v1-slot.v0));
        if(back)f.rotateY(Math.PI);f.translate(0,0,back?-.95:.95);faces.push(f)}
      const g=new THREE.Group();g.add(new THREE.Mesh(rim,gold),new THREE.Mesh(mergeGeometries(faces),faceMat));g.position.set(s.x,groundHeight(s.x,s.y)+16,s.y);g.visible=false;this.scene.add(g);this.secretModels.push({id:s.id,g,x:s.x,y:s.y})})}
  buildVehicles(){
    this.carSpec={...FLEET_SPEC};this.fleet=this.makeDriven(this.carSpec);
    this.parked=PARKED_SPOTS.map(p=>({x:p.x,y:p.y,angle:p.angle,spec:{id:p.id,type:p.type,paint:p.paint,stripe:p.stripe}}));this.parked.forEach(c=>this.meshParked(c));
    // ambient traffic is instanced (one draw call per material per vehicle type); trafficMeshes are light proxies
    // (position/rotation/userData) that the night lights and blob shadows read
    this.trafficFleet=new Fleet(this.scene,this.traffic.map(t=>({type:t.type||'sedan',paint:t.paint||'#c8ccd0'})));
    this.trafficMeshes=this.traffic.map((t,i)=>{const o=new THREE.Object3D(),d=this.trafficFleet.dims(i);o.userData={length:d.length,width:d.width};o.position.set(-9999,-500,-9999);return o});
  }
  makeDriven(spec){if(this.fleet){this.scene.remove(this.fleet);this.fleet.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose()})}const m=compactDriven(makeVehicle(spec.type,{paint:spec.paint,fleet:true,stripe:spec.stripe,ownTail:true}));this.scene.add(m);return m}
  resetCars(){if(!this.parked)return;this.carSpec={...FLEET_SPEC};PARKED_SPOTS.forEach((p,i)=>{Object.assign(this.parked[i],{x:p.x,y:p.y,angle:p.angle,spec:{id:p.id,type:p.type,paint:p.paint,stripe:p.stripe}});this.meshParked(this.parked[i])});this.fleet=this.makeDriven(this.carSpec);this.refreshProgress()}
  meshParked(c){if(c.mesh){this.scene.remove(c.mesh);c.mesh.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose()})}c.mesh=compactGroup(makeVehicle(c.spec.type,{paint:c.spec.paint,fleet:true,stripe:c.spec.stripe}));c.mesh.position.set(c.x,groundHeight(c.x,c.y),c.y);c.mesh.rotation.y=-c.angle;this.scene.add(c.mesh)}
  /** Obstacles for movement: buildings plus parked cars (and your own car while you are on foot). */
  obstacles(){if(!this.parked)return buildings;const list=this.parked.map(carBox);if(!this.player.inVehicle&&this.carSpec)list.push(carBox({...this.car,spec:this.carSpec}));
    // traffic is solid nearby (never a box you are already inside, so nobody gets trapped)
    const p=this.player,r=p.inVehicle?19:12;for(const c of this.traffic||[]){if(!Number.isFinite(c.x)||Math.abs(c.x-p.x)>220||Math.abs(c.y-p.y)>220)continue;const b=carBox(c);if(Math.hypot(p.x-clamp(p.x,b.x,b.x+b.w),p.y-clamp(p.y,b.y,b.y+b.h))>=r)list.push(b)}
    return buildings.concat(list)}
  nearestParked(){if(!this.parked)return -1;let best=-1,bd=100;for(let i=0;i<this.parked.length;i++){const d=distance(this.parked[i],this.player);if(d<bd){bd=d;best=i}}return distance(this.car,this.player)<bd?-1:best}
  /** Swap into parked car i: the car you were using stays parked where you left it. */
  swapInto(i){const P=this.parked[i];if(!P)return false;const left={x:this.car.x,y:this.car.y,angle:this.car.angle,spec:this.carSpec};this.car={x:P.x,y:P.y,angle:P.angle};this.carSpec=P.spec;
    Object.assign(P,{x:left.x,y:left.y,angle:left.angle,spec:left.spec});if(this.scene){this.meshParked(P);this.fleet=this.makeDriven(this.carSpec);this.refreshProgress()}return true}
  buildPeople(){
    this.avatar=makeHuman({skin:'#a86b3c',shirt:'#14a38f',pants:'#2d3a4e',hair:'#1c1713'});this.scene.add(this.avatar);
    this.carriedSample=new THREE.Mesh(new THREE.BoxGeometry(10,1.6,3),new THREE.MeshStandardMaterial({color:'#c4733f',metalness:.7,roughness:.3}));this.carriedSample.position.set(4.2,15.5,2.5);this.avatar.add(this.carriedSample);this.carriedSample.visible=false;
    const contacts=stations.length;this.busySpots=[...POWER_POINTS,...READINGS,...RELAYS,...stations.map(s=>({x:s.x+38,y:s.y-25}))];this.crowd=new Crowd(this.scene,this.pedestrians.length+contacts);const r=rng(55);
    for(let i=0;i<this.pedestrians.length+contacts;i++)this.crowd.setColors(i,{skin:SKIN[Math.floor(r()*SKIN.length)],shirt:i>=this.pedestrians.length?stations[i-this.pedestrians.length].color:SHIRTS[Math.floor(r()*SHIRTS.length)],pants:PANTS[Math.floor(r()*PANTS.length)],hair:HAIR[Math.floor(r()*HAIR.length)]});
  }
  /** Night lighting and grounding, all instanced: lamp light pools, lamp/beacon coronas (glow without bloom),
   * car head/tail coronas, headlight beams on the road, and blob shadows under cars and people. */
  buildNightLights(){const heads=this.lampHeads||[],n=heads.length,glow=glowTexture(64,.18);
    this.lampRank=heads.map((_,i)=>hash01(i+1));this.lampLevel=new Float32Array(n);this.lampDist=heads.map(h=>Math.min(3,Math.hypot(h.x-940,h.z-940)/1300));this.lampSnap=true;
    const flat=()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g};
    this.pools=new THREE.InstancedMesh(flat(),new THREE.MeshBasicMaterial({map:glowTexture(64,.4),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),Math.max(1,n));
    const o=new THREE.Object3D(),black=new THREE.Color(0,0,0);heads.forEach((h,i)=>{o.position.set(h.x,CURB+.12,h.z);o.scale.set(132,1,132);o.updateMatrix();this.pools.setMatrixAt(i,o.matrix);this.pools.setColorAt(i,black)});
    this.pools.computeBoundingSphere();this.pools.renderOrder=1;this.pools.visible=false;this.scene.add(this.pools);
    // static coronas: lamps, then the lighthouse lamp and relay beacons
    const extra=[[4600,205,-700,'#ffe7a0'],...RELAYS.map(t=>[t.x,groundHeight(t.x,t.y)+156,t.y,null])],cp=new Float32Array((n+extra.length)*3),cc=new Float32Array((n+extra.length)*3);
    heads.forEach((h,i)=>cp.set([h.x,h.y-1.2,h.z],i*3));extra.forEach(([x,y,z],k)=>cp.set([x,y,z],(n+k)*3));this.coronaExtra=extra;
    const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('color',new THREE.BufferAttribute(cc,3));
    this.coronas=new THREE.Points(cg,new THREE.PointsMaterial({size:40,map:glow,vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));
    this.coronas.visible=false;this.coronas.renderOrder=3;this.scene.add(this.coronas);
    // dynamic car lights: your car + traffic (4 lamps each) and one beam quad per car
    const cars=1+this.traffic.length;const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cars*12),3));lg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(cars*12),3));
    this.carGlow=new THREE.Points(lg,new THREE.PointsMaterial({size:13,map:glow,vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}));
    this.carGlow.frustumCulled=false;this.carGlow.visible=false;this.carGlow.renderOrder=3;this.scene.add(this.carGlow);
    const beamTex=canvasTexture(64,64,(c,w,h)=>{const g=c.createRadialGradient(0,h/2,0,0,h/2,w);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},{srgb:false});
    const bg=flat();bg.translate(.5,0,0);this.beams=new THREE.InstancedMesh(bg,new THREE.MeshBasicMaterial({map:beamTex,color:'#fff0cf',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),cars);
    this.beams.frustumCulled=false;this.beams.visible=false;this.beams.renderOrder=1;this.scene.add(this.beams);
    // blob shadows: avatar, your car, traffic, parked cars, crowd
    this.blobs=new Blobs(this.scene,2+this.traffic.length+(this.parked?.length||0)+this.crowd.count);
  }
  /** Lighting for a clock hour: sun/moon, sky, haze, water, exposure and every night-scaled emissive. */
  applyDay(hour){if(!this.sun)return;const k=sampleDay(hour),n=k.night;this.night=n;
    this.sunDir.copy(k.sunDir);this.sun.color.copy(k.sunColor);this.sun.intensity=k.sunI;
    this.hemi.color.copy(k.hemiSky);this.hemi.groundColor.copy(k.hemiGround);this.hemi.intensity=k.hemiI;this.scene.environmentIntensity=k.envI;
    const u=this.sky.material.uniforms;u.uTop.value.copy(k.skyTop);u.uMid.value.copy(k.skyMid);u.uHorizon.value.copy(k.skyHorizon);u.uFog.value.copy(k.fog);u.uNight.value=n;
    this.scene.fog.color.copy(k.fog);this.renderer.toneMappingExposure=k.exposure;
    const w=this.water.material.uniforms;w.uSky.value.copy(k.skyMid).lerp(k.skyHorizon,.35);w.uSunCol.value.copy(k.sunColor).multiplyScalar(1-n*.55);w.uDeep.value.copy(k.waterDeep);
    this.cloudMat.color.copy(k.cloud);this.cloudMat.opacity=.85-.4*n;
    // night: shadows fade out and the shadow map stops re-rendering (cheaper nights)
    this.sun.shadow.intensity=.85*(1-n);this.renderer.shadowMap.autoUpdate=n<.97;
    for(const [m,base,add] of this.nightMats)m.emissiveIntensity=base+n*add;
    const L=vehicleLights();L.head.emissiveIntensity=.7+n*2.5;L.tail.emissiveIntensity=.35+n*.9;
    const low=this.quality==='low';this.pools.visible=n>.02&&!low;this.pools.material.opacity=n*.5;this.coronas.visible=n>.02;this.coronas.material.opacity=n;this.coronas.material.size=low?32:52;
    this.carGlow.visible=n>.02;this.carGlow.material.opacity=Math.min(1,n*1.2);this.beams.visible=n>.02&&!low;this.beams.material.opacity=n*.42;
    if(Math.abs(n-(this.lampNight??-1))>.01){this.lampNight=n;this.lampsDirty=true}}
  /** Per-frame night work: lamp on/off sweep, window share, and the moving car lights. Cheap and skipped by day. */
  updateNightLights(realDt){const n=this.night,heads=this.lampHeads||[];
    CITY_LIGHTS.uLit.value+=(this.litTarget-CITY_LIGHTS.uLit.value)*Math.min(1,realDt*1.5);
    const frac=this.litTarget,now=performance.now()/1000;let changed=false;
    for(let i=0;i<heads.length;i++){const goal=this.lampRank[i]<frac?1:0,cur=this.lampLevel[i];if(cur===goal)continue;
      if(this.lampSnap)this.lampLevel[i]=goal;else if(goal<cur||now>(this.sweepT0||0)+this.lampDist[i])this.lampLevel[i]=goal>cur?Math.min(goal,cur+realDt*3):Math.max(goal,cur-realDt*3);else continue;changed=true}
    this.lampSnap=false;
    if(changed||this.lampsDirty){this.lampsDirty=false;const c=new THREE.Color(),cc=this.coronas.geometry.attributes.color;
      for(let i=0;i<heads.length;i++){const lv=this.lampLevel[i];c.copy(LENS_DAY).lerp(LENS_OFF,n).lerp(LENS_ON,lv*n);this.lenses.setColorAt(i,c);c.copy(LAMP_WARM).multiplyScalar(lv);this.pools.setColorAt(i,c);cc.setXYZ(i,lv*1,lv*.82,lv*.55)}
      this.coronaExtra.forEach((e,k)=>{c.set(e[3]||'#ffb455');if(!e[3]){const m=[...(this.relayModels?.values()||[])][k-1];if(m)c.copy(m.beacon.material.color)}cc.setXYZ(heads.length+k,c.r,c.g,c.b)});
      cc.needsUpdate=true;if(this.lenses.instanceColor)this.lenses.instanceColor.needsUpdate=true;if(this.pools.instanceColor)this.pools.instanceColor.needsUpdate=true}
    if(n<=.02)return;
    const pos=this.carGlow.geometry.attributes.position,col=this.carGlow.geometry.attributes.color,o=this.tmpObj||(this.tmpObj=new THREE.Object3D());let k=0;
    const put=(m,i,brake,on=true)=>{const L=(m.userData.length||64)/2,W=(m.userData.width||28)/2,a=-m.rotation.y,ca=Math.cos(a),sa=Math.sin(a),x=m.position.x,y=m.position.y,z=m.position.z;
      for(const [lx,ly,lz,r,g,b] of [[L+.4,9,W-4.6,on,.95*on,.82*on],[L+.4,9,-(W-4.6),on,.95*on,.82*on],[-L-.3,11.5,W-4.4,brake,.12*brake,.06*brake],[-L-.3,11.5,-(W-4.4),brake,.12*brake,.06*brake]]){pos.setXYZ(k,x+lx*ca-lz*sa,y+ly,z+lx*sa+lz*ca);col.setXYZ(k,r,g,b);k++}
      o.position.set(x+ca*(L-2),groundHeight(x,z)+.5,z+sa*(L-2));o.rotation.set(0,-a,0);o.scale.set(on?125:0,1,on?74:0);o.updateMatrix();this.beams.setMatrixAt(i,o.matrix)};
    const tail=this.fleet.userData.tail?.emissiveIntensity||.35,driving=this.player.inVehicle;put(this.fleet,0,driving?(tail>1.5?1.3:.75):0,driving);this.trafficMeshes.forEach((m,i)=>put(m,i+1,.75));
    pos.needsUpdate=true;col.needsUpdate=true;this.beams.instanceMatrix.needsUpdate=true}
  /** 'auto' (slow day/night cycle starting at golden hour) or a fixed 'day' | 'golden' | 'night'. */
  /** Grand finale after all six investigations: night city, every station beam on, fountains dance in changing
   * colors, slow aerial orbit. Remembers the time of day and puts it back afterwards. */
  startFinale(){if(this.finaleOn)return true;this.finaleOn={mode:this.timeMode,hour:this.dayHour,t0:performance.now()};this.setTimeMode('night');this.snapCamera=true;this.lastRender=0;return true}
  endFinale(){const f=this.finaleOn;if(!f)return false;this.finaleOn=null;this.timeMode=f.mode;this.dayHour=f.hour;this.dayAt=-1;this.resetShow();this.viewMode='chase';this.snapCamera=true;this.lastRender=0;this.refreshProgress?.();return true}
  setTimeMode(mode){const m=['auto','day','golden','night'].includes(mode)?mode:'auto';if(m!=='auto')this.dayHour=TIME_MODES[m];this.timeMode=m;this.dayAt=-1;this.lastRender=0;return m}
  /** n = completed investigations (0..6): more windows and street lamps light up at night. */
  setCityProgress(n){this.progressSet=true;this.cityProgressTo(n)}
  cityProgressTo(n){const v=clamp(Math.round(Number(n)||0),0,6),first=this.cityProgress==null;if(!first&&v===this.cityProgress)return;
    if(!first&&v>this.cityProgress)this.sweepT0=performance.now()/1000;this.cityProgress=v;this.litTarget=litFraction(v);if(first){CITY_LIGHTS.uLit.value=this.litTarget;this.lampSnap=true}this.lastRender=0}
  buildRouteLine(){const tex=chevronTexture();tex.repeat.set(1,1);this.routeTex=tex;
    this.routeMat=new THREE.MeshBasicMaterial({map:tex,color:'#ffd84a',transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
    this.routeGeo=new THREE.BufferGeometry();this.routeMesh=new THREE.Mesh(this.routeGeo,this.routeMat);this.routeMesh.frustumCulled=false;this.routeMesh.renderOrder=2;this.scene.add(this.routeMesh)}
  setRouteGeometry(points){const pos=[],uv=[];let acc=0;const W=6.5,samples=[];
    // Street legs sit in the right-hand driving lane (offset 26) so the guide never hides under the centre line.
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b.x-a.x,b.y-a.y)||1,lane=(i>1&&i<points.length-1)?26:0,ox=-(b.y-a.y)/len*lane,oz=(b.x-a.x)/len*lane,n=Math.max(1,Math.ceil(len/24));
      for(let k=(i===1?0:1);k<=n;k++){const t=k/n;samples.push({x:a.x+(b.x-a.x)*t+ox,y:a.y+(b.y-a.y)*t+oz})}}
    for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1,nx=-dz/len*W,nz=dx/len*W;
      const ya=groundHeight(a.x,a.y)+.6,yb=groundHeight(b.x,b.y)+.6,u0=acc/16,u1=(acc+len)/16;acc+=len;
      pos.push(a.x+nx,ya,a.y+nz, a.x-nx,ya,a.y-nz, b.x+nx,yb,b.y+nz, a.x-nx,ya,a.y-nz, b.x-nx,yb,b.y-nz, b.x+nx,yb,b.y+nz);
      uv.push(u0,1,u0,0,u1,1,u0,0,u1,0,u1,1)}
    this.routeGeo.dispose();this.routeGeo=new THREE.BufferGeometry();this.routeGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));this.routeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));this.routeMesh.geometry=this.routeGeo}
  // ------------------------------------------------------------------ controls & state API (unchanged contract)
  setStick(x,y){this.stick={x:clamp(Number(x)||0,-1,1),y:clamp(Number(y)||0,-1,1)}}
  focusWorkshop(){if(Math.hypot(this.player.x-940,this.player.y-940)>460)return false;this.viewMode='workshop';this.snapCamera=true;return true}
  recenterCamera(){this.viewMode='chase';this.cameraYaw=this.player.angle;this.orbitOffset=0;this.pitchOffset=0;this.lastLookAt=-10;this.snapCamera=true;this.carYaw=null}
  setCamera(mode){this.viewMode=mode==='overhead'?'overhead':'chase';this.orbitOffset=0;this.snapCamera=true;return this.viewMode}
  toggleVehicle(){const was=this.player.inVehicle;if(!was){const k=this.nearestParked();if(k>=0)this.swapInto(k)}const result=super.toggleVehicle();if(was&&result)this.cameraYaw=this.player.angle;this.orbitOffset=0;if(result){this.player.steer=0;this.carYaw=null;if(this.viewMode==='workshop'&&!was)this.viewMode='chase'}return result}
  recover(){super.recover();this.viewMode='chase';this.cameraYaw=-Math.PI/2;this.orbitOffset=0;this.pitchOffset=0;this.snapCamera=true;this.setStick(0,0);this.player.steer=0;this.carYaw=null}
  getState(){return {...super.getState(),carSpec:this.carSpec,parked:this.parked?.map(({x,y,angle,spec})=>({x,y,angle,spec}))}}
  loadPosition(position){super.loadPosition(position);
    if(this.parked&&Array.isArray(position?.parked)&&position.parked.length===this.parked.length&&position.carSpec?.type&&position.parked.every(c=>Number.isFinite(c?.x)&&Number.isFinite(c?.y)&&c?.spec?.type)){this.carSpec=position.carSpec;position.parked.forEach((c,i)=>{Object.assign(this.parked[i],{x:c.x,y:c.y,angle:c.angle||0,spec:c.spec});this.meshParked(this.parked[i])});this.fleet=this.makeDriven(this.carSpec)}this.cameraYaw=this.player.angle;this.snapCamera=true;this.carYaw=null}
  updateConfig(config){super.updateConfig(config);if(config.paused){this.setStick(0,0);this.drag=null}if(config.touchMode!==undefined)this.touchMode=!!config.touchMode;
    if(config.quality&&config.quality!=='auto'&&config.quality!==this.quality&&this.renderer)this.applyQuality(config.quality);
    if(config.quality==='auto'&&this.renderer&&this.qualityLocked){this.qualityLocked=false}
    if(this.markerGroups)this.refreshProgress();if(this.sampleModels)this.updateWorkshop();this.lastRender=0}
  tick(dt){
    this.frameDelta=dt;const before0={x:this.player.x,y:this.player.y};if(this.fountain?.running){this.advanceAmbient(dt);return}
    try{return this.tickMove(dt)}finally{const sc=this.config.scene;if(sc?.kind==='race'&&Number.isInteger(sc.slot)&&GATE_SLOTS[sc.slot]){const choice=gateCrossing(before0,this.player,GATE_SLOTS[sc.slot]);if(choice)this.onGate?.(sc.slot,choice)}}}
  tickMove(dt){
    if(this.player.inVehicle){const p=this.player,before={x:p.x,y:p.y};
      const steering=clamp((this.input.right?1:0)-(this.input.left?1:0)+(this.stick?.x||0),-1,1);
      const movedBy=driveStep(p,this.input,steering,dt,this.touchMode);const moved=moveWithCollisions(p.x,p.y,movedBy.dx,movedBy.dy,19,this.obstacles());
      p.x=moved.x;p.y=moved.y;
      // glancing hits keep most of the speed and steer the car along the wall; hard hits stop it, jolt the camera and call onImpact
      if(moved.hit){const k=collisionKeep(moved,movedBy.dx,movedBy.dy,19,this.obstacles()),impact=Math.abs(p.speed)*(1-k.keep);p.speed*=.25+.7*k.keep;
        if(p.speed>0&&k.keep>.3){const turn=wrap(k.dir-p.angle)*.35;p.angle+=turn;if(Number.isFinite(p.vAngle))p.vAngle+=turn}
        if(impact>40&&this.time-this.bumpAt>.25){this.bumpAt=this.time;this.impact=Math.min(1,impact/260);this.onImpact?.(this.impact)}}
      Object.assign(this.car,{x:p.x,y:p.y,angle:p.angle});this.driven+=distance(p,before);this.advanceAmbient(dt);return}
    const p=this.player,before={x:p.x,y:p.y};p.slip=0;p.sliding=false;
    const right=(this.input.right?1:0)-(this.input.left?1:0)+(this.stick?.x||0),forward=(this.input.up?1:0)-(this.input.down?1:0)-(this.stick?.y||0),length=Math.hypot(right,forward);
    p.speed=length?(this.input.shift?230:165)*Math.min(length,1):0;
    if(length){const yaw=this.moveYaw(),dx=(Math.cos(yaw)*forward-Math.sin(yaw)*right)/length,dy=(Math.sin(yaw)*forward+Math.cos(yaw)*right)/length;
      p.angle=Math.atan2(dy,dx);const move=moveWithCollisions(p.x,p.y,dx*p.speed*dt,dy*p.speed*dt,12,this.obstacles());p.x=move.x;p.y=move.y}
    this.walked+=distance(p,before);this.advanceAmbient(dt)}
  /** Heading that 'up' means: the chase camera's yaw, or the facing of a fixed camera that is on screen. */
  moveYaw(){if(this.viewMode==='chase')return this.cameraYaw;return Number.isFinite(this.viewYaw)?this.viewYaw:-Math.PI/2}
  advanceAmbient(dt){const p=this.player;
    this.advanceTraffic(dt);
    if(this.wp&&distance(this.wp,p)<60){this.wp=null;this.routeKey='';this.onWaypointReached?.()}
    for(const secret of this.secretPoints)if(distance(secret,p)<COIN_PICKUP&&!this.discovered.has(secret.id)){this.discovered.add(secret.id);this.onDiscover(secret.id)}
    if(this.time-this.notifyAt>.12){this.notify();this.notifyAt=this.time}}
  /** During a race, cars hold back ~150 units before the active gate so they never block an arch. */
  trafficBlockers(){const sc=this.config?.scene;return sc?.kind==='race'&&GATE_SLOTS[sc.slot]?[GATE_SLOTS[sc.slot]]:[]}
  /** Player-set GPS target (world units). While set, the gold route ribbon and the radar route lead here
   * instead of the mission target; it clears itself within 60 units and calls onWaypointReached. */
  setWaypoint(x,y){x=Number(x);y=Number(y);if(!Number.isFinite(x)||!Number.isFinite(y)){this.clearWaypoint();return null}
    let q={x:clamp(x,40,2238),y:clamp(y,68,1756)};if(circleCollides(q.x,q.y,14,buildings)){const r=snapToRoad(q);q={x:r.x,y:r.y}}
    this.wp=q;this.routeKey='';return {...q}}
  clearWaypoint(){const had=!!this.wp;this.wp=null;this.routeKey='';return had}
  get waypoint(){return this.wp?{x:this.wp.x,y:this.wp.y}:null}
  /** Full-map pixel (as drawn by drawFullMap at w×h) → world units, for map taps. */
  fullMapToWorld(px,py,w,h){const s=Math.min(w/2400,h/1800)||1;return {x:px/s,y:py/s}}
  nearbyWork(){if(this.player.inVehicle)return null;const p=this.player;let best=null,bd=Infinity;
    if(this.config.powerState?.enabled)for(const q of POWER_POINTS){const d=distance(q,p);if(d<105&&d<bd){best=q;bd=d}}
    const sc=this.config.scene||{};const consider=(list,r)=>{for(const q of list){const d=distance(q,p);if(d<r&&d<bd){best=q;bd=d}}};
    if(!best&&sc.kind==='courier')consider(DROP_ZONES,70);
    if(!best&&sc.kind==='survey')consider((this.readingPoints||=READINGS.map(r=>({id:'reading-'+r.sym,kind:'reading',sym:r.sym,name:r.where,x:r.x,y:r.y}))).filter(q=>!(sc.collected||{})[q.sym]),95);
    if(!best&&sc.kind==='relay')consider((this.relayPoints||=RELAYS.map(t=>({id:'relay-'+t.id,kind:'relay',relay:t.id,name:t.name,x:t.x,y:t.y}))).filter(q=>!(sc.solved||{})[q.relay]),95);
    return best}
  notify(){this.onChange({...this.player,nearby:this.nearbyStation(),nearbyWork:this.nearbyWork(),vehicleNearby:!this.player.inVehicle&&(distance(this.player,this.car)<100||this.nearestParked()>=0),carType:this.carSpec?.type,district:this.district(),walked:this.walked,driven:this.driven})}
  interact(){const point=this.nearbyWork();if(point){this.onWorldAction(point.id);return true}return super.interact()}
  tapWorkshop(event){if(!this.raycaster||this.player.inVehicle)return;const rect=this.canvas.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.raycaster.far=2000;this.raycaster.setFromCamera(pointer,this.viewCamera);const hit=this.raycaster.intersectObjects(this.workshopTargets,true)[0];if(!hit)return;
    let object=hit.object;while(object&&!object.userData.pointId)object=object.parent;const id=object?.userData.pointId;if(!id)return;
    const sc=this.config.scene||{};const pt=POWER_POINTS.find(p=>p.id===id)||READINGS.map(r=>({id:'reading-'+r.sym,x:r.x,y:r.y})).find(p=>p.id===id)||RELAYS.map(t=>({id:'relay-'+t.id,x:t.x,y:t.y})).find(p=>p.id===id);
    const allowed=id.startsWith('reading-')?sc.kind==='survey':id.startsWith('relay-')?sc.kind==='relay':this.config.powerState?.enabled;if(pt&&allowed&&distance(pt,this.player)<155)this.onWorldAction(id)}
  refreshProgress(){if(!this.markerGroups)return;const completed=this.config.completed||[];
    for(const [id,m] of this.markerGroups){const s=stations.find(x=>x.id===id),active=id===this.config.activeMission,done=completed.includes(id);
      if(m.done!==done){m.icon.material.map?.dispose();m.icon.material.map=iconTexture(s.code,done?'#86d9b7':s.color,done);m.icon.material.needsUpdate=true;m.done=done}
      m.active=active;m.beam.visible=active||id==='hq';m.beam.material.uniforms.uOpacity.value=active?.75:.35;m.ring.material.opacity=active?.95:done?.3:.55;m.disc.visible=active||id==='hq'}
    const live=completed.includes('power');this.signalsLive=live;if(!this.progressSet)this.cityProgressTo(completed.length);this.lampsDirty=true;
    if(this.fleet&&this.carSpec?.id==='fleet'){const skin=this.config.skin==='amber'?'#e09a2a':this.config.skin==='violet'?'#8a6fd1':'#14a38f';this.fleet.userData.stripe?.color.set(skin)}
    this.refreshScene()}
  refreshScene(){const sc=this.config.scene||{},done=this.config.completed||[];
    for(const [sym,m] of this.surveyModels||[]){const got=!!(sc.collected||{})[sym]||done.includes('survey');m.liquid.material.color.set(got?m.color:'#a9c6d6');m.liquid.material.emissive.set(got?m.color:'#000000');m.liquid.material.emissiveIntensity=got?.45:0;m.ring.visible=sc.kind==='survey'&&!got;m.g.visible=sc.kind==='survey'||done.includes('survey');m.label.visible=sc.kind==='survey'}
    for(const [id,m] of this.relayModels||[]){const on=!!(sc.solved||{})[id]||done.includes('ions');m.beacon.material.color.set(on?'#6ee7cf':'#ffb455');m.beacon.material.emissive.set(on?'#6ee7cf':'#ffb455');m.beam.visible=on;m.ring.visible=sc.kind==='relay'&&!on;m.label.visible=sc.kind==='relay'}
    if(this.gate){if(sc.kind==='race'&&Number.isInteger(sc.slot)){if(this.gate.key!==sc.slot+'|'+sc.a+'|'+sc.b){this.gate.key=sc.slot+'|'+sc.a+'|'+sc.b;this.setGateLabels(sc.a||'',sc.b||'');this.placeGate(sc.slot)}}else{this.gate.group.visible=false;this.gate.key=null}}
    if(this.dropRings)this.dropRings.visible=sc.kind==='courier'}
  // ------------------------------------------------------------------ per-frame
  render(){
    if(!this.renderer||!this.scene)return;const now=performance.now(),realDt=Math.min(.1,(now-this.clockLast)/1000);this.clockLast=now;
    // While a panel is open the city is behind a scrim: redraw ~8×/s to save battery.
    if(this.config.paused&&!this.config.titleCam&&!this.finaleOn&&now-this.lastRender<125)return;this.lastRender=now;
    const p=this.player,dt=this.config.paused?0:realDt,reduced=!!this.config.reducedMotion,t=this.time;
    if(this.timeMode==='auto'&&dt>0)this.dayHour=(this.dayHour+dt*HOURS_PER_SECOND)%24;
    if(this.dayAt<0||now-this.dayAt>500){this.dayAt=now;this.applyDay(this.dayHour)}
    // avatar
    this.avatar.visible=!p.inVehicle;const gy=groundHeight(p.x,p.y);this.avatarY+=(gy-this.avatarY)*Math.min(1,realDt*14);this.avatar.position.set(p.x,this.avatarY,p.y);
    const targetYaw=-p.angle;let dyaw=wrap(targetYaw-this.avatar.rotation.y);this.avatar.rotation.y+=dyaw*Math.min(1,realDt*14);
    const amp=p.inVehicle?0:clamp(Math.abs(p.speed)/165,0,1.2);this.walkPhase+=dt*(4+amp*7.5);poseHuman(this.avatar,this.walkPhase,amp,t,reduced);
    // fleet car
    const cy=groundHeight(this.car.x,this.car.y)+0;this.carY+=(cy-this.carY)*Math.min(1,realDt*10);this.fleet.position.set(this.car.x,this.carY,this.car.y);this.fleet.rotation.y=-this.car.angle;
    this.wheelPhase+=p.inVehicle?p.speed*dt/5.3:0;for(const w of this.fleet.userData.wheels){w.pivot.rotation.y=p.inVehicle&&w.front?-(p.steer||0)*.45:0;w.wheel.rotation.z=-this.wheelPhase}
    const speedN=Math.min(Math.abs(p.speed)/285,1),roll=reduced||!p.inVehicle?0:(p.steer||0)*speedN*.05,pitch=reduced||!p.inVehicle?0:clamp(-(p.acceleration||0)/9000,-.03,.03);
    this.fleet.rotation.x+=(roll-this.fleet.rotation.x)*Math.min(1,realDt*6);this.fleet.rotation.z+=(pitch-this.fleet.rotation.z)*Math.min(1,realDt*6);
    if(!reduced&&p.inVehicle&&this.impact>.02){const k=Math.max(0,1-(t-this.bumpAt)/.3);this.fleet.rotation.z+=k*this.impact*.04*Math.sign(p.speed||1)}
    this.updateSkids(p,reduced);
    const braking=p.inVehicle&&(this.input.space||this.input.handbrake||(this.input.down&&p.speed>3)||(this.input.up&&p.speed<-3));this.fleet.userData.tail.emissiveIntensity=braking?2.2:.35+this.night*.9;if(this.fleet.userData.reverse)this.fleet.userData.reverse.emissiveIntensity=p.inVehicle&&p.speed<-3?2:0;
    // carried sample
    const mat=this.config.powerState?.material;this.carriedSample.visible=!!mat&&!p.inVehicle&&!!this.config.powerState?.enabled;if(mat)this.carriedSample.material.color.set({copper:'#c4733f',graphite:'#3b3f42',sulfur:'#e2c445',silicon:'#7d8790'}[mat]);
    const live=this.config.completed?.includes('power')||this.config.powerState?.success;
    this.currentBeads.forEach((bead,i)=>{bead.visible=!!live&&this.cable.visible;if(bead.visible)bead.position.copy(this.cableCurve.getPointAt((i/5+(reduced?0:t*.3))%1))});
    // traffic
    // only cars near the view (last frame's camera, generous margin) are drawn; types with none in view cost no draw calls
    const fr=this.trafficFrustum||(this.trafficFrustum=new THREE.Frustum()),sph=this.trafficSphere||(this.trafficSphere=new THREE.Sphere(new THREE.Vector3(),90));
    fr.setFromProjectionMatrix(this.tmpM4.multiplyMatrices(this.viewCamera.projectionMatrix,this.viewCamera.matrixWorldInverse));this.trafficFleet.begin();
    this.traffic.forEach((tr,i)=>{const pos=Number.isFinite(tr.x)?tr:this.trafficPosition(tr.progress,tr.route||0),m=this.trafficMeshes[i];
      m.position.set(pos.x,groundHeight(pos.x,pos.y),pos.y);const yaw=-pos.angle;m.rotation.y=m.userData.placed?m.rotation.y+wrap(yaw-m.rotation.y)*Math.min(1,realDt*12):yaw;m.userData.placed=true;sph.center.copy(m.position);this.trafficFleet.set(i,m,fr.intersectsSphere(sph))});
    this.trafficFleet.commit();
    // pedestrians (instanced) + mission contacts
    const peds=this.pedestrians.length,B=this.blobs,bc=2+this.trafficMeshes.length+this.parked.length;
    const fast=p.inVehicle&&Math.abs(p.speed)>120&&!reduced;
    this.pedestrians.forEach((person,i)=>{const sp=12+person.seed%9;let {x,y:z,angle:ang}=pedestrianAt(person.seed,t),hop=0;
      const dd=Math.hypot(x-p.x,z-p.y);const clear=p.inVehicle?58:40;if(dd<clear){x+=(x-p.x)/(dd||1)*(clear-dd);z+=(z-p.y)/(dd||1)*(clear-dd)}
      if(fast&&dd<90){hop=3*Math.abs(Math.sin(t*12+person.seed));ang=Math.atan2(z-p.y,x-p.x)}
      // step aside around traffic: never inside a car's footprint
      for(const c of this.traffic){if(Math.abs(c.x-x)>48||Math.abs(c.y-z)>48)continue;const ca=Math.cos(c.angle),sa=Math.sin(c.angle),dx=x-c.x,dz=z-c.y,lx=dx*ca+dz*sa,ly=-dx*sa+dz*ca,hl=(c.half||32)+5,hw=19;
        if(Math.abs(lx)<hl&&Math.abs(ly)<hw){const ny=Math.sign(ly||1)*hw;x=c.x+lx*ca-ny*sa;z=c.y+lx*sa+ny*ca}}
      const hidden=circleCollides(x,z,7)||x>2240||this.busySpots.some(q=>Math.abs(q.x-x)<42&&Math.abs(q.y-z)<42);
      const gz=groundHeight(x,z);this.crowd.set(i,x,gz+hop,z,ang,t*(sp/2.2)+person.seed,reduced?.5:.55,{visible:!hidden});if(hidden)this.blobs.hide(bc+i);else this.blobs.set(bc+i,x,gz+.08,z,0,13,13)});
    stations.forEach((s,k)=>{const x=s.x+38,z=s.y-25,face=Math.atan2(p.y-z,p.x-x),near=Math.hypot(p.x-x,p.y-z)<160;this.crowd.set(peds+k,x,groundHeight(x,z),z,near?face:Math.atan2(s.y-z,s.x-x)+.4,0,0,{wave:near&&s.id===this.config.activeMission&&!reduced?t:0});B.set(bc+peds+k,x,groundHeight(x,z)+.08,z,0,13,13)});
    this.crowd.commit();
    // blob shadows under you, your car, traffic and parked cars (ground them when real shadows are off)
    if(p.inVehicle)B.hide(0);else B.set(0,p.x,gy+.08,p.y,0,16,16);
    const carBlob=(i,m)=>{const L=m.userData.length||64,W=m.userData.width||28;B.set(i,m.position.x,groundHeight(m.position.x,m.position.z)+.08,m.position.z,m.rotation.y,L*1.15,W*1.35)};
    carBlob(1,this.fleet);this.trafficMeshes.forEach((m,i)=>carBlob(2+i,m));this.parked.forEach((c,i)=>c.mesh&&carBlob(2+this.trafficMeshes.length+i,c.mesh));B.commit();
    // markers
    for(const [id,m] of this.markerGroups){const s=stations.find(x=>x.id===id),d=Math.hypot(s.x-p.x,s.y-p.y);const inWork=id==='power'&&this.config.powerState?.enabled;
      m.group.visible=!inWork;const pulse=reduced?1:1+Math.sin(t*3)*.06;m.ring.scale.setScalar(pulse);m.icon.position.y=48+(reduced?0:Math.sin(t*2+s.x)*2.2);
      m.text.visible=!this.finaleOn&&(d<650||m.active)&&d>60&&this.viewMode!=='overhead';m.beam.visible=this.finaleOn?true:(m.active||id==='hq')&&d>40;
      if(this.finaleOn)m.beam.material.uniforms.uOpacity.value=reduced?.6:.5+.25*Math.sin(performance.now()/1000*2+s.x*.01)}
    const powerOn=!!this.config.powerState?.enabled;for(const l of this.workshopLabels||[])l.sign.visible=powerOn&&!p.inVehicle&&Math.hypot(l.point.x-p.x,l.point.y-p.y)<420;
    this.updateWorkshopGuide(t,reduced);
    for(const s of this.secretModels){s.g.visible=!this.discovered.has(s.id)&&Math.abs(s.x-p.x)<700&&Math.abs(s.y-p.y)<700&&Math.hypot(s.x-p.x,s.y-p.y)<700;if(s.g.visible&&!reduced)s.g.rotation.y=t*1.6}
    this.updateWaypointMarker(t,reduced);
    for(const [,mm] of this.surveyModels)if(mm.ring.visible&&!reduced)mm.ring.scale.setScalar(1+Math.sin(t*3)*.07);
    if(this.dropRings?.visible&&!reduced)this.dropRings.children.forEach((r,i)=>r.scale.setScalar(1+Math.sin(t*3+i)*.08));
    this.updateFountains(realDt,reduced);
    for(const b of this.boats){b.g.position.y=reduced?0:Math.sin(t*.9+b.phase)*1.2;b.g.rotation.z=reduced?0:Math.sin(t*.7+b.phase)*.025}
    this.water.material.uniforms.uTime.value=reduced?0:t;
    if(this.wind){this.wind.uTime.value=t;this.wind.uAmp.value=reduced||this.quality==='low'?0:1}
    this.updateNightLights(realDt);
    this.updateSignals(t);this.updateRoute(realDt);
    this.updateCamera(realDt);
    // keep the sun's shadow frustum centred on the action, snapped to texels to avoid shimmer
    // (centred ahead of the camera so shadows reach further down the street; snapped after the offset)
    if(this.sun.castShadow){const c=this.camTarget,hy=this.headingYaw(),ahead=this.quality==='high'?300:200,size=this.sun.shadow.camera.right*2/(this.sun.shadow.mapSize.x||1024);
      const sx=Math.round((c.x+Math.cos(hy)*ahead)/size)*size,sz=Math.round((c.z+Math.sin(hy)*ahead)/size)*size,D=this.sunDir;this.sun.target.position.set(sx,0,sz);this.sun.position.set(sx+D.x*2400,D.y*2400,sz+D.z*2400)}
    this.sky.position.copy(this.viewCamera.position);
    this.renderer.render(this.scene,this.viewCamera);
    this.trackPerformance(now);
  }
  /** Handbrake slides leave fading tyre marks from both rear wheels (off on 'low'). */
  updateSkids(p,reduced){const S=this.skids;if(!S||!S.mesh.visible)return;S.uTime.value=this.time;
    if(!p.inVehicle||!(p.slip>.15)||Math.abs(p.speed)<40){this.skidLast=null;return}
    const v=VEHICLES[this.carSpec?.type]||VEHICLES.compact,ca=Math.cos(p.angle),sa=Math.sin(p.angle),cur=[1,-1].map(side=>{const lz=side*(v.W/2-2.5);return {x:p.x-v.wx*ca-lz*sa,z:p.y-v.wx*sa+lz*ca}});
    if(!this.skidLast){this.skidLast=cur;return}
    for(let k=0;k<2;k++){const a=this.skidLast[k],b=cur[k],d=Math.hypot(b.x-a.x,b.z-a.z);if(d<6)continue;if(d<40)S.add(a.x,a.z,b.x,b.z,groundHeight(b.x,b.z)+.32,2.6,this.time);this.skidLast[k]=b}}
  /** A tall pink beam marks the player's GPS waypoint (one draw call, only while a waypoint is set). */
  updateWaypointMarker(t,reduced){const w=this.wp;if(!w){if(this.wpBeam)this.wpBeam.visible=false;return}
    if(!this.wpBeam){this.wpBeam=new THREE.Mesh(new THREE.CylinderGeometry(8,12,360,20,1,true),beamMaterial('#ff5fd2'));this.scene.add(this.wpBeam)}
    const d=Math.hypot(w.x-this.player.x,w.y-this.player.y);this.wpBeam.visible=d>60;this.wpBeam.position.set(w.x,groundHeight(w.x,w.y)+180,w.y);this.wpBeam.scale.setScalar(reduced?1:1+Math.sin(t*3)*.05)}
  updateSignals(t){const S=this.signal;if(!S)return;const set=(g,r,a,gr)=>{g.r.emissiveIntensity=r;g.a.emissiveIntensity=a;g.g.emissiveIntensity=gr};
    if(!this.signalsLive){const blink=(Math.floor(t*1.6)%2)?2.4:.15;set(S.ns,0,blink,0);set(S.ew,0,blink,0);return}
    // the same phase function the cars obey (world.js signalPhase)
    const ph=signalPhase(t),lamp=k=>k==='green'?[0,0,2.4]:k==='amber'?[0,2.4,0]:[2.4,0,0];set(S.ns,...lamp(ph.ns));set(S.ew,...lamp(ph.ew))}
  activeTarget(){const sc=this.config.scene||{},p=this.player,near=list=>list.reduce((b,q)=>!b||distance(q,p)<distance(b,p)?q:b,null);
    if(this.wp)return this.wp;
    if(sc.kind==='race'&&Number.isInteger(sc.slot))return GATE_SLOTS[sc.slot]||null;
    if(sc.kind==='survey'){const left=READINGS.filter(r=>!(sc.collected||{})[r.sym]);if(left.length)return near(left)}
    if(sc.kind==='relay'){const left=RELAYS.filter(t=>!(sc.solved||{})[t.id]);if(left.length)return near(left)}
    if(sc.kind==='courier')return null;
    const id=this.config.activeMission,s=stations.find(s=>s.id===id);return s?{x:s.x,y:s.y}:null}
  updateRoute(dt){const target=this.activeTarget(),p=this.player;const show=!!target&&this.config.guideLine!==false&&this.viewMode!=='workshop'&&Math.hypot(target.x-p.x,target.y-p.y)>150;
    this.routeMesh.visible=show;if(!target){this.route=[];return}
    const key=`${Math.round(p.x/30)},${Math.round(p.y/30)},${target.x},${target.y}`;if(key!==this.routeKey){this.routeKey=key;this.route=routeTo(p,target);if(show)this.setRouteGeometry(this.route)}
    else if(show&&!this.routeGeo.attributes.position)this.setRouteGeometry(this.route);
    if(!this.config.reducedMotion)this.routeTex.offset.x-=dt*1.4}
  updateCamera(dt){const now=()=>performance.now();
    const p=this.player,reduced=!!this.config.reducedMotion,cam=this.viewCamera;let fov=60,roll=0,shake=0,rumble=0;
    if(!this.drag&&this.config.autoCamera!==false&&this.time-(this.lastLookAt||0)>2.5){this.pitchOffset*=Math.exp(-dt*1.2);
      if(p.inVehicle)this.orbitOffset*=Math.exp(-dt*1.6);else if(p.speed>30&&!this.stick?.x&&!this.input.left&&!this.input.right)this.cameraYaw+=wrap(p.angle-this.cameraYaw)*(1-Math.exp(-dt*.8))}
    const base=this.camTarget;
    if(this.finaleOn){const el=(now()-this.finaleOn.t0)/1000,a=(reduced?0:el*.035)+2.3;base.set(1200,40,950);this.desiredCamera.set(1200+Math.cos(a)*780,820,950+Math.sin(a)*780);this.lookTarget.set(1250,120,950);cam.position.copy(this.desiredCamera);cam.lookAt(this.lookTarget);this.smoothLook=this.lookTarget.clone();if(cam.fov!==55){cam.fov=55;cam.updateProjectionMatrix()}this.snapCamera=true;return}
    if(this.config.titleCam){const a=(reduced?0:now()/1000*.045)+2.3;base.set(1200,40,950);this.desiredCamera.set(1200+Math.cos(a)*780,820,950+Math.sin(a)*780);this.lookTarget.set(1250,120,950);cam.position.copy(this.desiredCamera);cam.lookAt(this.lookTarget);this.smoothLook=this.lookTarget.clone();if(cam.fov!==55){cam.fov=55;cam.updateProjectionMatrix()}this.snapCamera=true;return}
    if(this.viewMode==='show'){base.set(2470,30,950);this.desiredCamera.set(2236,95,1150);this.lookTarget.set(2470,70,950);fov=55}
    else if(this.viewMode==='workshop'&&!p.inVehicle){base.set(940,10,940);this.desiredCamera.set(620,175,962);this.lookTarget.set(960,8,935);fov=55}
    else if(this.viewMode==='overhead'){base.set(p.x,0,p.y);this.desiredCamera.set(p.x,720,p.y+160);this.lookTarget.set(p.x,0,p.y);fov=55}
    else if(p.inVehicle){const speed=Math.min(Math.abs(p.speed)/285,1);if(this.carYaw===null||this.snapCamera)this.carYaw=p.angle;
      // chase camera: low boom, horizon high in frame, looks down the street ahead; elastic yaw lag and a swing out on turns
      const follow=reduced?1:1-Math.exp(-dt*(2+speed*1.6));this.carYaw+=wrap(p.angle-this.carYaw)*follow;
      const yaw=this.carYaw+this.orbitOffset,pitch=clamp(.12+this.pitchOffset,.04,.95),dist=100+speed*34;
      const ahead=reduced?0:clamp(p.speed*.12,-10,34);base.set(p.x+Math.cos(p.angle)*ahead,this.carY+18,p.y+Math.sin(p.angle)*ahead);
      this.desiredCamera.set(base.x-Math.cos(yaw)*Math.cos(pitch)*dist,base.y+Math.sin(pitch)*dist+6,base.z-Math.sin(yaw)*Math.cos(pitch)*dist);
      const look=reduced?26:26+speed*60;this.lookTarget.set(base.x+Math.cos(yaw)*look,base.y+6,base.z+Math.sin(yaw)*look);
      if(!reduced){const swing=-(p.steer||0)*speed*16;this.desiredCamera.x-=Math.sin(this.carYaw)*swing;this.desiredCamera.z+=Math.cos(this.carYaw)*swing;
        roll=-(p.steer||0)*speed*.03;const since=this.time-(this.bumpAt??-9),k=Math.max(0,1-since/.4);shake=k*k*(1.5+5*(this.impact??.5));rumble=.25*speed*speed}
      fov=reduced?60:57+speed*15+clamp((p.acceleration||0)/3000,0,1)*3}
    else{const sprint=!reduced&&this.input.shift&&p.speed>200,pitch=clamp(this.cameraPitch+this.pitchOffset,.02,1.05),dist=76+(sprint?8:0),yaw=this.cameraYaw;base.set(p.x,this.avatarY+21,p.y);
      this.desiredCamera.set(base.x-Math.cos(yaw)*Math.cos(pitch)*dist,base.y+Math.sin(pitch)*dist,base.z-Math.sin(yaw)*Math.cos(pitch)*dist);this.lookTarget.set(base.x+Math.cos(yaw)*14,base.y-1,base.z+Math.sin(yaw)*14);if(sprint)fov=65}
    if(this.viewMode!=='overhead'&&this.viewMode!=='show'){const safe=cameraSafePosition(this.viewMode==='workshop'?this.lookTarget:base,this.desiredCamera,this.cameraObstacles,9);this.desiredCamera.set(safe.x,Math.max(safe.y,groundHeight(safe.x,safe.z)+5),safe.z)}
    const smooth=this.snapCamera||reduced?1:1-Math.exp(-(p.inVehicle?9:10)*dt),cb=this.camBase&&!this.snapCamera?this.camBase:(this.camBase=cam.position.clone());cb.lerp(this.desiredCamera,smooth);cam.position.copy(cb);
    if(this.snapCamera||reduced)this.smoothLook=this.lookTarget.clone();else{this.smoothLook||=this.lookTarget.clone();this.smoothLook.lerp(this.lookTarget,1-Math.exp(-14*dt))}
    // bump jolt and a faint road rumble (never with reduced motion), applied after smoothing so they do not accumulate
    if(shake||rumble){const t=this.time;cam.position.x+=Math.sin(t*53)*shake;cam.position.y+=Math.sin(t*41+1)*shake+Math.sin(t*31)*rumble;cam.position.z+=Math.sin(t*47+2)*shake}
    cam.lookAt(this.smoothLook);if(roll)cam.rotateZ(roll);this.viewYaw=this.viewMode==='chase'?this.cameraYaw:Math.atan2(this.smoothLook.z-cam.position.z,this.smoothLook.x-cam.position.x);
    if(this.viewMode==='workshop'&&!p.inVehicle&&Math.hypot(p.x-940,p.y-940)>480){this.cameraYaw=this.viewYaw;this.viewMode='chase'}if(Math.abs(cam.fov-fov)>.05){cam.fov+=(fov-cam.fov)*(reduced?1:Math.min(1,dt*3));cam.updateProjectionMatrix()}this.snapCamera=false}
  trackPerformance(now){const f=this.fpsWindow;if(this.config.paused||document.hidden){f.t=0;f.n=0;return}f.n++;if(!f.t)f.t=now;if(now-f.t<2500)return;const fps=f.n*1000/(now-f.t);f.t=now;f.n=0;
    this.canvas.dataset.renderFps=String(Math.round(fps));this.canvas.dataset.drawCalls=String(this.renderer.info.render.calls);this.canvas.dataset.triangles=String(this.renderer.info.render.triangles);this.canvas.dataset.quality=this.quality;
    if(this.config.paused||this.config.quality&&this.config.quality!=='auto')return;
    if(fps<36){f.low++;if(f.low>=2&&this.quality!=='low'){this.applyQuality(this.quality==='high'?'balanced':'low');f.low=0;this.onQuality?.(this.quality)}}else f.low=0}
  // ------------------------------------------------------------------ radar & map
  headingYaw(){return this.viewMode==='overhead'||this.viewMode==='workshop'?-Math.PI/2:this.player.inVehicle?(this.carYaw??this.player.angle)+this.orbitOffset:this.cameraYaw}
  renderMap(){if(!this.mapCtx||!this.mapWidth)return;const now=performance.now();if(now-this.radarAt<(this.config.paused?250:40))return;this.radarAt=now;
    const c=this.mapCtx,d=this.mapDpr||1,w=this.mapWidth,h=this.mapHeight,R=Math.min(w,h)/2-2,p=this.player;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);
    const worldR=p.inVehicle?620+Math.min(Math.abs(p.speed),285)*1.2:520,k=R/worldR,yaw=this.headingYaw();
    c.save();c.translate(w/2,h/2);c.beginPath();c.arc(0,0,R,0,Math.PI*2);c.clip();c.fillStyle='#24312b';c.fillRect(-R,-R,R*2,R*2);
    c.rotate(-Math.PI/2-yaw);c.scale(k,k);c.translate(-p.x,-p.y);this.drawCity(c,1/k,true);c.restore();
    // blips (kept upright), clamped to the rim when off-radar
    const toScreen=(x,y)=>{const dx=x-p.x,dy=y-p.y,a=-Math.PI/2-yaw,ca=Math.cos(a),sa=Math.sin(a);let sx=(dx*ca-dy*sa)*k,sy=(dx*sa+dy*ca)*k;const L=Math.hypot(sx,sy),edge=L>R-9;if(edge){sx*=(R-9)/L;sy*=(R-9)/L}return {x:w/2+sx,y:h/2+sy,edge}};
    const completed=this.config.completed||[],active=this.config.activeMission;
    for(const s of stations){const q=toScreen(s.x,s.y),act=s.id===active,done=completed.includes(s.id);if(q.edge&&!act&&s.id!=='hq')continue;this.blip(c,q.x,q.y,done?'✓':s.code,act?'#ffcc33':done?'#7fbfa8':s.color,act?11:8,act&&!this.config.reducedMotion?1+Math.sin(now/180)*.12:1)}
    const sc=this.config.scene||{};
    if(sc.kind==='survey')for(const r of READINGS){if((sc.collected||{})[r.sym])continue;const q=toScreen(r.x,r.y);this.drop(c,q.x,q.y,'#5fd3ff')}
    if(sc.kind==='relay')for(const t of RELAYS){if((sc.solved||{})[t.id])continue;const q=toScreen(t.x,t.y);this.blip(c,q.x,q.y,'⚡','#6ee7cf',8)}
    if(sc.kind==='race'&&GATE_SLOTS[sc.slot]){const g=GATE_SLOTS[sc.slot],q=toScreen(g.x,g.y);this.blip(c,q.x,q.y,'⛳','#ffcc33',10)}
    if(sc.kind==='courier'){c.font='900 10px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';for(const b of buildings){const q=toScreen(b.x+b.w/2,b.y+b.h/2);if(q.edge)continue;c.fillStyle='#0b1418';c.beginPath();c.roundRect(q.x-10,q.y-8,20,16,4);c.fill();c.fillStyle='#ffc46a';c.fillText(b.mark,q.x,q.y+.5)}}
    if(this.wp){const q=toScreen(this.wp.x,this.wp.y);this.pin(c,q.x,q.y,1)}
    for(const pc of this.parked||[]){const q=toScreen(pc.x,pc.y);if(q.edge)continue;c.fillStyle=pc.spec.paint;c.strokeStyle='#0b1418';c.lineWidth=1.5;c.beginPath();c.roundRect(q.x-4.5,q.y-3,9,6,2);c.fill();c.stroke()}
    if(!p.inVehicle){const q=toScreen(this.car.x,this.car.y);if(!q.edge){c.fillStyle='#14a38f';c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.roundRect(q.x-5,q.y-3.5,10,7,2);c.fill();c.stroke()}}
    c.save();c.translate(w/2,h/2);c.rotate(p.angle-yaw);c.fillStyle='#ffffff';c.strokeStyle='#0b1418';c.lineWidth=2;c.beginPath();c.moveTo(0,-8);c.lineTo(6,7);c.lineTo(0,4);c.lineTo(-6,7);c.closePath();c.fill();c.stroke();c.restore();
    const na=-Math.PI/2-yaw-Math.PI/2,nx=w/2+Math.cos(na)*(R-8),ny=h/2+Math.sin(na)*(R-8);c.fillStyle='#0b1418';c.beginPath();c.arc(nx,ny,7,0,7);c.fill();c.fillStyle='#fff';c.font='800 9px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('N',nx,ny+.5);
    c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.beginPath();c.arc(w/2,h/2,R,0,Math.PI*2);c.stroke()}
  blip(c,x,y,label,color,r,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle=color;c.strokeStyle='#0b1418';c.lineWidth=2;c.beginPath();c.arc(0,0,r,0,7);c.fill();c.stroke();c.fillStyle='#0b1418';c.font=`900 ${Math.round(r*1.02)}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(label,0,.5);c.restore()}
  pin(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#ff5fd2';c.strokeStyle='#0b1418';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(-6,-10);c.arc(0,-13,7,Math.PI*.8,Math.PI*.2);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(0,-13,2.6,0,7);c.fill();c.restore()}
  /** Found element coins only (unfound ones stay secret). */
  drawCoins(ctx,r){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';for(const s of this.secretPoints||[]){if(!this.discovered?.has(s.id))continue;ctx.fillStyle='#ffd54f';ctx.strokeStyle='#0b1418';ctx.lineWidth=r*.18;ctx.beginPath();
    for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;ctx.lineTo(s.x+Math.cos(a)*r,s.y+Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#3a2c05';ctx.font=`900 ${Math.round(r*((s.symbol||'').length>1?.8:1))}px system-ui,sans-serif`;ctx.fillText(s.symbol||'?',s.x,s.y+r*.06)}ctx.restore()}
  drop(c,x,y,color){c.save();c.translate(x,y);c.fillStyle=color;c.strokeStyle='#0b1418';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-8);c.quadraticCurveTo(7,0,0,6);c.quadraticCurveTo(-7,0,0,-8);c.fill();c.stroke();c.restore()}
  /** Draw streets, blocks, buildings, water and route in world coordinates. */
  drawCity(c,px=1,radar=false){c.fillStyle='#1e5f86';c.fillRect(SEA_X,-3000,6000,9000);c.fillStyle='#34433a';c.fillRect(-3000,-3000,SEA_X+3000,9000);
    c.strokeStyle='#8b9599';c.lineWidth=120;c.lineCap='butt';c.beginPath();for(const x of RX_ALL){c.moveTo(x,-3000);c.lineTo(x,6000)}for(const y of RY_ALL){c.moveTo(-3000,y);c.lineTo(SEA_X,y)}c.stroke();
    c.fillStyle='#55665c';for(const b of buildings)c.fillRect(b.x,b.y,b.w,b.h);
    if(this.route.length>1&&this.config.guideLine!==false||radar&&this.route.length>1){c.strokeStyle='#0b1418';c.lineWidth=11*px;c.lineJoin='round';c.beginPath();this.route.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke();c.strokeStyle='#ffcc33';c.lineWidth=6*px;c.stroke()}}
  drawFullMap(ctx,w,h){const sx=w/2400,sy=h/1800,s=Math.min(sx,sy);ctx.save();ctx.fillStyle='#24312b';ctx.fillRect(0,0,w,h);ctx.scale(s,s);this.drawCity(ctx,1/s*2.4);
    ctx.font='800 54px system-ui,sans-serif';ctx.fillStyle='#dfe8e4';ctx.textAlign='center';for(const [k,n] of Object.entries(STREET_NAMES)){const v=Number(k.slice(1));if(k[0]==='x'){ctx.save();ctx.translate(v+4,300);ctx.rotate(Math.PI/2);ctx.fillText(n,0,0);ctx.restore()}else ctx.fillText(n,300,v+10)}
    const completed=this.config.completed||[];for(const st of stations){const act=st.id===this.config.activeMission;this.blip(ctx,st.x,st.y,completed.includes(st.id)?'✓':st.code,act?'#ffcc33':st.color,act?70:56)}
    const sc=this.config.scene||{};ctx.font='900 40px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';for(const b of buildings){ctx.fillStyle='#0b1418cc';ctx.beginPath();ctx.roundRect(b.x+b.w/2-34,b.y+b.h/2-28,68,56,10);ctx.fill();ctx.fillStyle='#ffc46a';ctx.fillText(b.mark,b.x+b.w/2,b.y+b.h/2+2)}
    if(sc.kind==='survey')for(const r of READINGS)if(!(sc.collected||{})[r.sym])this.drop2(ctx,r.x,r.y);
    if(sc.kind==='relay')for(const t of RELAYS)if(!(sc.solved||{})[t.id])this.blip(ctx,t.x,t.y,'⚡','#6ee7cf',50);
    this.drawCoins(ctx,30);if(this.wp)this.pin(ctx,this.wp.x,this.wp.y,5);
    ctx.translate(this.player.x,this.player.y);ctx.rotate(this.player.angle+Math.PI/2);ctx.fillStyle='#fff';ctx.strokeStyle='#0b1418';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-64);ctx.lineTo(46,50);ctx.lineTo(0,30);ctx.lineTo(-46,50);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  drop2(c,x,y){c.save();c.translate(x,y);c.scale(6,6);this.drop(c,0,0,'#5fd3ff');c.restore()}
  destroy(){super.destroy();if(!this.renderer)return;const cv=this.canvas;cv.removeEventListener('pointerdown',this.pointerDown);cv.removeEventListener('pointermove',this.pointerMove);
    for(const t of ['pointerup','pointercancel','lostpointercapture'])cv.removeEventListener(t,this.pointerUp);cv.removeEventListener('webglcontextlost',this.contextLost);
    const geos=new Set(),mats=new Set(),texs=new Set(this.disposables);this.scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of [].concat(o.material||[])){mats.add(m);for(const k of ['map','roughnessMap','metalnessMap','emissiveMap'])if(m[k])texs.add(m[k])}});
    geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());texs.forEach(t=>t.dispose());this.envTarget?.dispose();this.renderer.dispose()}
}
