/** Deterministic arcade fleet handling, in world units; independent of rendering. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(a,b,step)=>a<b?Math.min(b,a+step):Math.max(b,a-step);
export function driveStep(p,input,steering,dt,touch=true){
 const throttle=(input.up?1:0)-(input.down?1:0),brake=!!(input.space||input[' ']);
 const target=clamp(steering,-1,1);p.steer=approach(p.steer||0,target,dt*4.2);
 const before=p.speed,limit=touch?285:335;
 if(brake)p.speed=approach(p.speed,0,520*dt);
 else if(throttle){const braking=p.speed*throttle<0;p.speed+=throttle*(braking?430:205*(1-Math.min(Math.abs(p.speed)/limit,.9)*.52))*dt;}
 else p.speed=approach(p.speed,0,(18+Math.abs(p.speed)*.28)*dt);
 p.speed=clamp(p.speed,-105,limit);if(Math.abs(p.speed)<.7)p.speed=0;
 const speed=Math.abs(p.speed);const rate=(1.9/(1+speed/260))*clamp(speed/65,0,1);
 p.angle+=p.steer*rate*Math.sign(p.speed)*dt;
 p.acceleration=(p.speed-before)/dt;
 return {dx:Math.cos(p.angle)*p.speed*dt,dy:Math.sin(p.angle)*p.speed*dt};
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
