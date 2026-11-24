/** Deterministic arcade fleet handling, in world units; independent of rendering. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(a,b,step)=>a<b?Math.min(b,a+step):Math.max(b,a-step);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
/** One driving step. Space is the handbrake: straight ahead it brakes like before; held while steering at
 * speed (> 140 units/s) the rear lets go, so the car rotates faster than it travels (p.slip, p.sliding).
 * Without the handbrake the travel direction snaps to the body heading, exactly as before. */
/** Per-car performance multipliers (1 = the original fleet car): top speed, acceleration, braking, grip. */
export const CAR_PERF={compact:{},sedan:{},suv:{},van:{},s6:{top:1.12,accel:1.3,brake:1.1,grip:1.05},gt2:{top:1.6,accel:2,brake:1.35,grip:1.25}};
export function driveStep(p,input,steering,dt,touch=true,perf){const k=perf||{},top=k.top||1,acc=k.accel||1,brk=k.brake||1,grip=k.grip||1;
 const throttle=(input.up?1:0)-(input.down?1:0),hand=!!(input.handbrake||input.space||input[' ']);
 const target=clamp(steering,-1,1);p.steer=approach(p.steer||0,target,dt*4.2);
 const before=p.speed,limit=(touch?285:335)*top,slide=hand&&Math.abs(p.steer)>.25&&p.speed>140;
 if(!Number.isFinite(p.vAngle))p.vAngle=p.angle;
 if(slide)p.speed=approach(p.speed,0,160*dt);
 else if(hand)p.speed=approach(p.speed,0,520*dt);
 else if(throttle){const braking=p.speed*throttle<0;p.speed+=throttle*(braking?430*brk:205*acc*(1-Math.min(Math.abs(p.speed)/limit,.9)*.52))*dt;}
 else p.speed=approach(p.speed,0,(18+Math.abs(p.speed)*.28)*dt);
 p.speed=clamp(p.speed,-105,limit);if(Math.abs(p.speed)<.7)p.speed=0;
 const speed=Math.abs(p.speed);const rate=(1.9/(1+speed/260))*clamp(speed/65,0,1)*(slide?1.7:1)*grip;
 p.angle+=p.steer*rate*Math.sign(p.speed)*dt;
 // velocity heading: lags the body while sliding, then the slip decays smoothly (no snap back)
 const slip=wrap(p.angle-p.vAngle),prev=p.slip||0;
 if(slide){p.vAngle+=slip*Math.min(1,2*dt);const left=wrap(p.angle-p.vAngle);if(Math.abs(left)>.9)p.vAngle=p.angle-Math.sign(left)*.9}
 else if(prev>.01){const keep=Math.min(Math.abs(slip),prev*Math.exp(-5*dt));p.vAngle=p.angle-Math.sign(slip)*keep}
 else p.vAngle=p.angle;
 p.slip=Math.abs(wrap(p.angle-p.vAngle));p.sliding=slide;
 p.acceleration=(p.speed-before)/dt;
 return {dx:Math.cos(p.vAngle)*p.speed*dt,dy:Math.sin(p.vAngle)*p.speed*dt};
}
export function cameraSafePosition(target,desired,obstacles,padding=14){
 // Shorten the boom before the first expanded building hit (slab intersection).
 const dx=desired.x-target.x,dy=desired.y-target.y,dz=desired.z-target.z;let fraction=1;
 for(const b of obstacles){let enter=0,exit=1;const bounds=[[target.x,dx,b.x-padding,b.x+b.w+padding],[target.y,dy,-10,b.height*3.1+padding],[target.z,dz,b.y-padding,b.y+b.h+padding]];let hit=true;
  for(const [origin,direction,min,max] of bounds){if(Math.abs(direction)<1e-8){if(origin<min||origin>max){hit=false;break}}else{let a=(min-origin)/direction,c=(max-origin)/direction;if(a>c)[a,c]=[c,a];enter=Math.max(enter,a);exit=Math.min(exit,c);if(enter>exit){hit=false;break}}}
  if(hit&&exit>0&&enter>0)fraction=Math.min(fraction,Math.max(.08,enter-.045));
 }
 return {x:target.x+dx*fraction,y:target.y+dy*fraction,z:target.z+dz*fraction};
}
