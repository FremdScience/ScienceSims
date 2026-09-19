(()=>{
  const {SUBSTANCES,readings,boilingPoint,meltingPoint,phaseAt}=window.MatterModel;
  const pcanvas=document.querySelector('#particles'),pctx=pcanvas.getContext('2d'),map=document.querySelector('#phase-map'),mctx=map.getContext('2d');
  const state={trials:[],particles:Array.from({length:42},(_,i)=>({x:0,y:0,vx:((i*17)%11-5)/8,vy:((i*29)%13-6)/8})),phase:null,particleWidth:0,particleHeight:0};

  function values(){return{key:document.querySelector('#substance').value,temp:+document.querySelector('#temperature').value,pressure:+document.querySelector('#pressure').value};}
  function sizeCanvas(canvas,ctx,minHeight,ratio){
    const width=Math.max(320,Math.round(canvas.getBoundingClientRect().width));
    const height=Math.round(Math.max(minHeight,width*ratio));
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.style.height=`${height}px`;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return{w:width,h:height};
  }
  function update(){
    const v=values(),r=readings(v.key,v.temp,v.pressure);
    document.querySelector('#temperature-value').textContent=`${v.temp} °C`;
    document.querySelector('#pressure-value').textContent=`${v.pressure.toFixed(1)} atm`;
    document.querySelector('#phase-badge').textContent=r.phase[0].toUpperCase()+r.phase.slice(1);
    document.querySelector('#kinetic').textContent=r.kinetic.toFixed(2);
    document.querySelector('#spacing').textContent=r.spacing;
    document.querySelector('#boiling').textContent=`${r.boiling} °C`;
    updateMacro(r,v);drawMap(v);return r;
  }
  function updateMacro(r,v){
    const sample=document.querySelector('#sample'),piston=document.querySelector('#piston'),thermo=document.querySelector('#thermometer');
    piston.style.top=`${10+(v.pressure-0.5)/2.5*70}px`;
    thermo.style.height=`${Math.max(4,Math.min(96,(v.temp+220)/400*100))}%`;
    sample.style.background=SUBSTANCES[v.key].color+'aa';
    if(r.phase==='solid'){
      sample.style.height='35%';sample.style.left='18%';sample.style.right='18%';sample.style.borderRadius='10px 10px 0 0';
      document.querySelector('#observation').textContent='The sample keeps a definite shape and volume.';
    }else if(r.phase==='liquid'){
      sample.style.height='48%';sample.style.left='0';sample.style.right='0';sample.style.borderRadius='0';
      document.querySelector('#observation').textContent='The sample keeps its volume but takes the container’s shape.';
    }else{
      sample.style.height=`${Math.round(100-(v.pressure-.5)/2.5*28)}%`;sample.style.left='0';sample.style.right='0';sample.style.borderRadius='0';sample.style.opacity='.26';
      document.querySelector('#observation').textContent='The gas fills the available space and compresses as pressure increases.';
    }
    if(r.phase!=='gas')sample.style.opacity='1';
  }
  function layoutParticles(phase,w,h){
    const cols=phase==='solid'?7:phase==='liquid'?7:6;
    state.particles.forEach((p,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      if(phase==='solid'){
        const gap=Math.min(36,(w-90)/(cols-1));
        p.x=w/2+(col-(cols-1)/2)*gap;p.y=h-42-(5-row)*gap;
      }else if(phase==='liquid'){
        const gapX=(w-72)/(cols-1),gapY=Math.min(25,(h*.4-30)/5);
        p.x=Math.min(w-24,36+col*gapX+(row%2?gapX*.18:0));p.y=h-28-row*gapY-((i*13)%9);
      }else{
        const rows=7;
        p.x=38+col*(w-76)/(cols-1)+((i*19)%13-6);
        p.y=44+row*(h-88)/(rows-1)+((i*23)%15-7);
      }
      p.vx=((i*17)%11-5)/7||.55;p.vy=((i*29)%13-6)/7||-.45;
    });
    state.phase=phase;state.particleWidth=w;state.particleHeight=h;
  }
  function animate(){
    const v=values(),r=readings(v.key,v.temp,v.pressure),speed=.35+r.kinetic*1.15;
    drawParticles(r,v,speed);requestAnimationFrame(animate);
  }
  function drawParticles(r,v,speed){
    const w=state.particleWidth,h=state.particleHeight;
    if(!w||!h)return;
    if(state.phase!==r.phase)layoutParticles(r.phase,w,h);
    pctx.clearRect(0,0,w,h);
    const grad=pctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#102b38');grad.addColorStop(1,'#061820');pctx.fillStyle=grad;pctx.fillRect(0,0,w,h);
    const radius=r.phase==='gas'?8:11;
    for(let i=0;i<state.particles.length;i++){
      const p=state.particles[i];
      if(r.phase==='solid'){
        const col=i%7,row=Math.floor(i/7),gap=Math.min(36,(w-90)/6),tx=w/2+(col-3)*gap,ty=h-42-(5-row)*gap;
        p.x+=(tx-p.x)*.14;p.y+=(ty-p.y)*.14;
        const vibration=.45+.55*r.kinetic;p.x+=Math.sin(performance.now()/95+i*1.7)*.18*vibration;p.y+=Math.cos(performance.now()/105+i)*.12*vibration;
      }else{
        const gas=r.phase==='gas',top=gas?22+(v.pressure-.5)/2.5*h*.3:h*.57;
        p.x+=p.vx*speed*(gas?2.5:1.05);p.y+=p.vy*speed*(gas?2.5:1.05);
        if(!gas)p.vy+=.006;
        if(p.x<radius||p.x>w-radius){p.vx*=-1;p.x=Math.max(radius,Math.min(w-radius,p.x));}
        if(p.y<top+radius||p.y>h-radius){p.vy*=-1;p.y=Math.max(top+radius,Math.min(h-radius,p.y));}
      }
      pctx.beginPath();pctx.arc(p.x,p.y,radius,0,Math.PI*2);pctx.fillStyle=SUBSTANCES[v.key].color;pctx.fill();pctx.lineWidth=1.5;pctx.strokeStyle='rgba(255,255,255,.72)';pctx.stroke();
    }
    pctx.fillStyle='white';pctx.font='700 16px system-ui';pctx.fillText(`${r.phase.toUpperCase()} · ${v.temp} °C · ${v.pressure.toFixed(1)} atm`,18,28);
    if(r.phase==='gas'){
      const top=22+(v.pressure-.5)/2.5*h*.3;pctx.strokeStyle='rgba(255,209,0,.75)';pctx.setLineDash([8,6]);pctx.beginPath();pctx.moveTo(12,top);pctx.lineTo(w-12,top);pctx.stroke();pctx.setLineDash([]);pctx.fillStyle='#ffe98a';pctx.font='600 13px system-ui';pctx.fillText('compressed volume boundary',18,top-7);
    }
  }
  function drawMap(v){
    const w=map._logicalWidth||600,h=map._logicalHeight||310,pad=46,right=18,top=18,bottom=42;
    mctx.clearRect(0,0,w,h);mctx.fillStyle='#f8fbfa';mctx.fillRect(0,0,w,h);
    const x=t=>pad+(t+230)/430*(w-pad-right),y=p=>h-bottom-(p-.5)/2.5*(h-bottom-top);
    const colors={solid:'#cde4f4',liquid:'#d9f0dc',gas:'#f7e0b5'},step=5;
    for(let px=pad;px<w-right;px+=step){for(let py=top;py<h-bottom;py+=step){const temp=(px-pad)/(w-pad-right)*430-230,pressure=.5+(h-bottom-py)/(h-bottom-top)*2.5;mctx.fillStyle=colors[phaseAt(v.key,temp,pressure)];mctx.fillRect(px,py,step+1,step+1);}}
    mctx.strokeStyle='#17322a';mctx.lineWidth=1.5;mctx.beginPath();mctx.moveTo(pad,top);mctx.lineTo(pad,h-bottom);mctx.lineTo(w-right,h-bottom);mctx.stroke();
    mctx.beginPath();for(let p=.5;p<=3.001;p+=.1){const px=x(boilingPoint(v.key,p)),py=y(p);p===.5?mctx.moveTo(px,py):mctx.lineTo(px,py);}mctx.strokeStyle='#b13a32';mctx.lineWidth=3;mctx.stroke();
    mctx.beginPath();for(let p=.5;p<=3.001;p+=.1){const px=x(meltingPoint(v.key,p)),py=y(p);p===.5?mctx.moveTo(px,py):mctx.lineTo(px,py);}mctx.strokeStyle='#1877a8';mctx.lineWidth=2;mctx.stroke();
    mctx.beginPath();mctx.arc(x(v.temp),y(v.pressure),7,0,Math.PI*2);mctx.fillStyle='#005530';mctx.fill();mctx.strokeStyle='white';mctx.lineWidth=2;mctx.stroke();
    mctx.fillStyle='#17322a';mctx.font='700 14px system-ui';mctx.fillText('solid',pad+10,38);mctx.fillText('liquid',Math.max(pad+70,x(meltingPoint(v.key,2))+12),38);mctx.fillText('gas',w-55,38);mctx.fillText('Temperature →',w-123,h-10);mctx.save();mctx.translate(14,h/2+35);mctx.rotate(-Math.PI/2);mctx.fillText('Pressure (atm)',0,0);mctx.restore();
  }
  ['substance','temperature','pressure'].forEach(id=>document.querySelector(`#${id}`).addEventListener('input',update));
  document.querySelector('#run-trial').addEventListener('click',()=>{const pred=document.querySelector('input[name="prediction"]:checked')?.value,feedback=document.querySelector('#feedback');if(!pred){feedback.className='feedback error';feedback.textContent='Choose a prediction before running the trial.';return;}const v=values(),r=update();state.trials.push({...v,prediction:pred,phase:r.phase});feedback.className='feedback '+(pred===r.phase?'success':'');feedback.textContent=pred===r.phase?'Prediction supported. Compare the particle and observable views.':`The model shows ${r.phase}. Use the particle spacing and phase map to revise your thinking.`;renderTrials();});
  function renderTrials(){document.querySelector('#trial-count').textContent=`${state.trials.length} trial${state.trials.length===1?'':'s'} recorded`;document.querySelector('#trials').innerHTML=state.trials.map(t=>`<tr><td>${SUBSTANCES[t.key].name}</td><td>${t.temp} °C</td><td>${t.pressure.toFixed(1)} atm</td><td>${t.prediction}</td><td>${t.phase}</td></tr>`).join('');}
  document.querySelector('#check-mystery').addEventListener('click',()=>{const ok=document.querySelector('#mystery').value==='ethanol',f=document.querySelector('#mystery-feedback');f.className='feedback '+(ok?'success':'error');f.textContent=ok?'Correct. Both phase-change temperatures match ethanol at 1 atm.':'Not yet. Compare both the melting point and boiling point, not just one value.';});
  document.querySelector('#clear').addEventListener('click',()=>{state.trials=[];renderTrials();});
  document.querySelector('#download').addEventListener('click',()=>{if(!state.trials.length)return;const rows=['Substance,Temperature_C,Pressure_atm,Prediction,Observed_phase',...state.trials.map(t=>`${SUBSTANCES[t.key].name},${t.temp},${t.pressure},${t.prediction},${t.phase}`)];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='matter-trials.csv';a.click();URL.revokeObjectURL(a.href);});
  function resizeParticles(){const s=sizeCanvas(pcanvas,pctx,340,.72);state.particleWidth=s.w;state.particleHeight=s.h;state.phase=null;}
  function resizeMap(){const s=sizeCanvas(map,mctx,250,.52);map._logicalWidth=s.w;map._logicalHeight=s.h;drawMap(values());}
  new ResizeObserver(resizeParticles).observe(pcanvas);new ResizeObserver(resizeMap).observe(map);resizeParticles();resizeMap();update();renderTrials();requestAnimationFrame(animate);
})();
