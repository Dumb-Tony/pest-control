(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    phase: document.getElementById('phaseLabel'), damage: document.getElementById('damageLabel'),
    trust: document.getElementById('trustLabel'), budget: document.getElementById('budgetLabel'),
    seed: document.getElementById('seedLabel'), objective: document.getElementById('objective'),
    instruction: document.getElementById('instruction'), caption: document.getElementById('canvasCaption'),
    primary: document.getElementById('primaryAction'), diagnosis: document.getElementById('diagnosisPanel'),
    tools: document.getElementById('toolsPanel'), inventory: document.getElementById('inventoryLabel'),
    evidenceCount: document.getElementById('evidenceCount'), log: document.getElementById('eventLog'),
    modal: document.getElementById('resultModal'), resultGrade: document.getElementById('resultGrade'),
    resultTitle: document.getElementById('resultTitle'), resultSummary: document.getElementById('resultSummary'),
    resultStats: document.getElementById('resultStats'), sound: document.getElementById('soundToggle'),
    share: document.getElementById('shareButton'), shareStatus: document.getElementById('shareStatus')
  };

  const rooms = {
    attic:{id:'attic',label:'ATTIC',x:250,y:58,w:455,h:105,color:'#695a46'},
    nursery:{id:'nursery',label:'NURSERY',x:250,y:178,w:220,h:155,color:'#d6aeb1'},
    hall:{id:'hall',label:'UPSTAIRS HALL',x:485,y:178,w:220,h:155,color:'#d3bd84'},
    garage:{id:'garage',label:'GARAGE',x:85,y:348,w:290,h:170,color:'#8c9b91'},
    kitchen:{id:'kitchen',label:'KITCHEN',x:390,y:348,w:315,h:170,color:'#b9c98b'},
    outside:{id:'outside',label:'FRONT YARD / ENTRY',x:720,y:348,w:155,h:170,color:'#638b74'}
  };
  const graph = {
    attic:['nursery','garage'],nursery:['attic','hall'],hall:['nursery','kitchen','garage'],
    garage:['attic','hall','kitchen'],kitchen:['hall','garage','outside'],outside:[]
  };
  const evidence = [
    {id:'tracks',x:390,y:118,title:'Hand-like tracks',detail:'Five long toes in the insulation. Much larger than rat prints.'},
    {id:'fur',x:420,y:220,title:'Coarse dark fur',detail:'Caught on the ceiling crack beneath the attic.'},
    {id:'soffit',x:799,y:395,title:'Pried soffit',detail:'The aluminum edge was pulled outward by something dexterous.'},
    {id:'sound',x:600,y:250,title:'Heavy night movement',detail:'A slow thump-scrape after midnight, not light daytime skittering.'}
  ];
  const phaseNames = {
    briefing:'Briefing',investigate:'Investigation',diagnose:'Diagnosis',prepare:'Preparation',
    contain:'Live containment',closeout:'Repair & cleanup',resolved:'Job complete'
  };
  const phaseOrder=['briefing','investigate','diagnose','prepare','contain','closeout'];
  const costs={trap:55,barrier:25,seal:35,clean:30};
  const suppliedSeed=new URLSearchParams(location.search).get('seed');
  const jobSeed=(suppliedSeed||'0147').slice(0,24);
  let state,audioContext;
  let soundEnabled=true,animationStarted=false;

  function hashSeed(value){let hash=2166136261;for(const char of value){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0||1;}
  function seededRandom(){state.rngState=(state.rngState+0x6D2B79F5)>>>0;let value=state.rngState;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return((value^value>>>14)>>>0)/4294967296;}
  function playCue(type){
    if(!soundEnabled)return;
    try{
      audioContext||=new(window.AudioContext||window.webkitAudioContext)();
      const now=audioContext.currentTime,gain=audioContext.createGain(),osc=audioContext.createOscillator();
      const cue={inspect:[520,.08,'sine'],select:[310,.06,'triangle'],start:[120,.28,'sawtooth'],step:[150,.09,'triangle'],breach:[70,.42,'square'],capture:[660,.32,'sine'],repair:[430,.16,'triangle'],clean:[760,.2,'sine'],fail:[90,.5,'sawtooth']}[type]||[300,.08,'sine'];
      osc.frequency.setValueAtTime(cue[0],now);osc.type=cue[2];gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+cue[1]);osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+cue[1]+.02);
    }catch{soundEnabled=false;ui.sound.setAttribute('aria-pressed','false');ui.sound.textContent='Sound unavailable';}
  }

  function freshState(){return{
    phase:'briefing',selectedTool:'inspect',found:[],diagnosis:null,seed:jobSeed,rngState:hashSeed(jobSeed),decisionCount:0,
    traps:[],barriers:[],damage:0,trust:100,budget:240,
    animal:{room:'attic',previous:null,stress:10,captured:false,escaped:false,moving:false,from:'attic',to:'attic',moveStart:0,moveDuration:650},
    simStarted:0,nextDecision:0,incidents:{nursery:false,kitchen:false},closeout:{seal:false,clean:false},
    log:[{time:'22:14',text:`Dispatch: heavy attic noise, damaged soffit. Job seed ${jobSeed}.`}],hoverRoom:null,hoverEvidence:null,resolved:false
  };}
  function reset(){state=freshState();ui.modal.hidden=true;updateUI();}
  function roomCenter(id){const r=rooms[id];return{x:r.x+r.w/2,y:r.y+r.h/2};}
  function log(text){const active=['contain','closeout'].includes(state.phase),seconds=active&&state.simStarted?Math.floor((performance.now()-state.simStarted)/1000):0;state.log.unshift({time:seconds?`+${String(seconds).padStart(2,'0')}s`:'22:—',text});state.log=state.log.slice(0,12);}
  function setPhase(phase){state.phase=phase;updateUI();}
  function inspectClue(item){if(state.phase!=='investigate'||state.found.includes(item.id))return;state.found.push(item.id);log(`${item.title}: ${item.detail}`);ui.caption.textContent=item.detail;playCue('inspect');if(state.found.length===2)log('Enough evidence to log a diagnosis. More clues improve confidence.');updateUI();}
  function chooseDiagnosis(species){
    if(state.phase!=='diagnose')return;state.diagnosis=species;playCue('select');
    if(species==='raccoon'){log('Diagnosis confirmed: raccoon. Use a sturdy live trap and control its escape route.');state.trust=Math.min(100,state.trust+2);}
    else{log(`Diagnosis logged as ${species}. The evidence does not fit; the attic animal is already agitated.`);state.trust-=10;state.animal.stress=38;}
    state.selectedTool='trap';setPhase('prepare');
  }

  function placeContainmentTool(roomId){
    if(roomId==='outside'||(roomId==='attic'&&state.selectedTool==='barrier')){ui.caption.textContent=roomId==='outside'?'The yard cannot hold containment equipment.':'You cannot seal the animal inside the attic.';return;}
    if(state.selectedTool==='trap'){
      if(state.phase==='contain'){ui.caption.textContent='The trap cannot be moved while the animal is loose.';return;}
      if(state.traps[0]===roomId){state.traps=[];state.budget+=costs.trap;log('Live trap returned to the van.');}
      else if(state.traps.length){const from=rooms[state.traps[0]].label.toLowerCase();state.traps=[roomId];log(`Live trap moved from ${from} to ${rooms[roomId].label.toLowerCase()}.`);}
      else{if(state.budget<costs.trap)return;state.traps=[roomId];state.budget-=costs.trap;log(`Live trap armed in ${rooms[roomId].label.toLowerCase()}.`);}
      ui.caption.textContent=roomId==='garage'?'Good: quiet, near the attic route, and away from occupants.':'Bait helps, but an open escape route may still look safer.';playCue('select');
    }else if(state.selectedTool==='barrier'){
      if(state.barriers.includes(roomId)){
        if(state.phase==='contain'){ui.caption.textContent='Do not pull a barrier while the animal is loose.';return;}
        state.barriers=state.barriers.filter(id=>id!==roomId);state.budget+=costs.barrier;log(`Barrier removed from ${rooms[roomId].label.toLowerCase()}.`);playCue('select');
      }else{
        if(state.barriers.length>=3){ui.caption.textContent='All three temporary barriers are deployed.';return;}
        if(state.animal.room===roomId&&state.phase==='contain'){ui.caption.textContent='Too late—the raccoon is already in that room.';return;}
        if(state.budget<costs.barrier)return;state.barriers.push(roomId);state.budget-=costs.barrier;log(`${state.phase==='contain'?'Emergency b':'B'}arrier placed across ${rooms[roomId].label.toLowerCase()} route.`);playCue('select');
      }
    }
    updateUI();
  }

  function performCloseout(roomId){
    const cleanRoom=state.incidents.nursery?'nursery':'attic';
    if(state.selectedTool==='seal'){
      if(roomId!=='outside'){ui.caption.textContent='The pried soffit entry is outside at the front-yard side of the cutaway.';return;}
      if(state.closeout.seal){ui.caption.textContent='The soffit entry is already sealed.';return;}if(state.budget<costs.seal)return;
      state.closeout.seal=true;state.budget-=costs.seal;state.trust=Math.min(100,state.trust+5);log('ENTRY SEALED: mesh and flashing secured over the pried soffit. Trust +5.');playCue('repair');state.selectedTool=state.closeout.clean?'seal':'clean';
    }else if(state.selectedTool==='clean'){
      if(roomId!==cleanRoom){ui.caption.textContent=`Contamination is concentrated in the ${rooms[cleanRoom].label.toLowerCase()}.`;return;}
      if(state.closeout.clean){ui.caption.textContent='The contaminated area is already cleaned.';return;}if(state.budget<costs.clean)return;
      state.closeout.clean=true;state.budget-=costs.clean;state.trust=Math.min(100,state.trust+5);log(`AREA CLEANED: HEPA vacuum and disinfectant used in ${rooms[cleanRoom].label.toLowerCase()}. Trust +5.`);playCue('clean');state.selectedTool=state.closeout.seal?'clean':'seal';
    }
    updateUI();
  }
  function placeTool(roomId){if(['prepare','contain'].includes(state.phase))placeContainmentTool(roomId);else if(state.phase==='closeout')performCloseout(roomId);}
  function startContainment(){if(state.phase!=='prepare')return;if(!state.traps.length){ui.caption.textContent='Place the live trap before disturbing the attic.';return;}state.phase='contain';state.simStarted=performance.now();state.nextDecision=state.simStarted+1050;log('Containment started. Footsteps in the attic—watch the route and be ready to react.');ui.caption.textContent='SCRATCH—THUMP. The raccoon is choosing a way out.';playCue('start');updateUI();}
  function scoreDestination(from,id){let score=0;if(id==='outside')score+=125;if(id==='nursery')score+=from==='attic'?62:10;if(id==='hall')score+=38;if(id==='kitchen')score+=58;if(id==='garage')score+=18;if(state.traps.includes(id))score+=state.diagnosis==='raccoon'?35:8;if(id===state.animal.previous)score-=36;if(id==='nursery'&&state.incidents.nursery)score-=8;return score+Math.min(24,state.animal.stress*.25);}
  function makeDecision(now){
    const a=state.animal,options=graph[a.room].filter(id=>!state.barriers.includes(id));
    if(!options.length){state.damage+=90;state.trust-=18;a.stress+=22;log(`Cornered in ${rooms[a.room].label.toLowerCase()}: clawing damages trim while the raccoon searches again.`);if(state.barriers.length){const failed=state.barriers.pop();log(`The ${rooms[failed].label.toLowerCase()} barrier buckles under pressure.`);}state.nextDecision=now+1250;playCue('breach');updateUI();return;}
    const ranked=options.map(id=>({id,score:scoreDestination(a.room,id)+seededRandom()*6}));ranked.sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id));const target=ranked[0].id;state.decisionCount+=1;a.previous=a.room;a.from=a.room;a.to=target;a.moving=true;a.moveStart=now;ui.caption.textContent=`Movement: ${rooms[a.room].label.toLowerCase()} → ${rooms[target].label.toLowerCase()}.`;playCue('step');
  }
  function beginCloseout(){state.phase='closeout';state.selectedTool='seal';log('ANIMAL SECURED: transfer cage latched. Seal the entry and clean contamination before submitting the job.');ui.caption.textContent='Capture complete. Finish the property work: patch the soffit and decontaminate the affected room.';playCue('capture');updateUI();}
  function finishMove(now){
    const a=state.animal;a.room=a.to;a.moving=false;a.stress+=8;
    if(a.room==='nursery'&&!state.incidents.nursery){state.incidents.nursery=true;state.damage+=180;state.trust-=22;log('CEILING BREACH: the raccoon drops into the occupied nursery. Damage +$180, trust −22.');ui.caption.textContent='The open route led through weak plaster. Block the kitchen while it is still upstairs.';playCue('breach');}
    if(a.room==='kitchen'&&!state.incidents.kitchen){state.incidents.kitchen=true;state.damage+=125;state.trust-=16;log('KITCHEN RAID: food and dishes hit the floor. Damage +$125, trust −16.');playCue('breach');}
    if(state.traps.includes(a.room)){if(state.diagnosis==='raccoon'){a.captured=true;log(`Trap secured in ${rooms[a.room].label.toLowerCase()}.`);beginCloseout();return;}state.traps=[];state.damage+=35;state.trust-=8;a.stress+=22;log('WRONG-SIZE TRAP: the door snaps early. The animal bolts; damage +$35, trust −8.');playCue('breach');}
    if(a.room==='outside'){a.escaped=true;log('The raccoon reaches the front walk and disappears into the neighborhood.');resolve(false);return;}
    if(state.damage>=650||state.trust<=0){log('The customer stops the job after escalating damage.');resolve(false);return;}
    state.nextDecision=now+(a.room==='nursery'?2600:900);updateUI();
  }
  function stat(label,value){const box=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=label;strong.textContent=value;box.append(small,strong);return box;}
  function resolve(captured){
    state.phase='resolved';state.resolved=true;const trust=Math.max(0,state.trust),complete=state.closeout.seal&&state.closeout.clean;let grade=captured&&complete?(state.damage===0&&trust>=95?'A':state.damage<250&&trust>=60?'B':'C'):'D';if(!captured&&trust<35)grade='F';const jobValue=Math.max(0,(captured?420:90)-state.damage-Math.max(0,240-state.budget));ui.resultGrade.textContent=grade;ui.resultTitle.textContent=captured?'Job completed':'Animal escaped';ui.resultSummary.textContent=captured?(state.incidents.nursery?'You recovered the containment, removed the animal, and finished the property work. The ceiling damage still reduced the invoice.':'Diagnosis, containment, exclusion, and cleanup all held together. Mrs. Alvarez can sleep in the house tonight.'):'The route stayed open through the house. Follow the field log backward, change the preparation, and try the same seed again.';ui.resultStats.replaceChildren(stat('Damage',`$${state.damage}`),stat('Trust',String(trust)),stat('Job value',`$${jobValue}`));updateUI();if(!captured)playCue('fail');setTimeout(()=>{ui.modal.hidden=false;document.getElementById('modalRestart').focus();},450);
  }
  function setTool(tool){const allowed=(tool==='inspect'&&state.phase==='investigate')||(['trap','barrier'].includes(tool)&&['prepare','contain'].includes(state.phase))||(['seal','clean'].includes(tool)&&state.phase==='closeout');if(!allowed)return;state.selectedTool=tool;playCue('select');updateUI();}
  function renderLog(){const items=state.log.map(item=>{const li=document.createElement('li'),strong=document.createElement('strong');strong.textContent=item.time;li.append(strong,document.createTextNode(` — ${item.text}`));return li;});ui.log.replaceChildren(...items);}
  function updateUI(){
    ui.phase.textContent=phaseNames[state.phase];ui.damage.textContent=`$${state.damage}`;ui.trust.textContent=Math.max(0,state.trust);ui.budget.textContent=`$${state.budget}`;ui.seed.textContent=state.seed;
    const closeDone=Number(state.closeout.seal)+Number(state.closeout.clean);ui.evidenceCount.textContent=state.phase==='closeout'?`${closeDone} / 2 tasks`:`${state.found.length} / ${evidence.length} clues`;
    ui.inventory.textContent=state.phase==='closeout'?`Entry ${state.closeout.seal?'sealed':'open'} · Area ${state.closeout.clean?'clean':'contaminated'}`:`Trap ${state.traps.length}/1 · Barriers ${state.barriers.length}/3 · click placed gear to undo`;
    renderLog();ui.diagnosis.hidden=state.phase!=='diagnose';ui.tools.hidden=!['investigate','prepare','contain','closeout'].includes(state.phase);ui.primary.hidden=false;ui.primary.disabled=false;
    const copy={briefing:['Review the call','Mrs. Alvarez heard heavy movement above the nursery after midnight. Identify it, prepare a route, remove it, and finish the property work.','Accept job'],investigate:['Collect evidence','Click amber markers in the cutaway. Two clues unlock diagnosis; all four give the clearest picture.',state.found.length>=2?'Log diagnosis':`Find ${2-state.found.length} more clue${state.found.length===1?'':'s'}`],diagnose:['Name the animal','Compare the clues, then commit. A wrong diagnosis means the wrong trap setup.','Choose a species below'],prepare:['Shape a safe route','Place the live trap, then block dangerous rooms. Click placed gear again to undo it before starting.','Start containment'],contain:['Contain and recover','The orange route preview shows the next move. You can place emergency barriers ahead of the animal.','Containment active'],closeout:['Finish the property work',`The animal is secure. Seal the outside soffit and clean the ${state.incidents.nursery?'nursery':'attic'} before leaving.`,closeDone===2?'Submit completed job':`Complete ${2-closeDone} more task${closeDone===1?'':'s'}`],resolved:['Job closed','Review the event chain, share the seed, or run another call.','Job complete']}[state.phase];
    [ui.objective.textContent,ui.instruction.textContent,ui.primary.textContent]=copy;if(state.phase==='investigate'&&state.found.length<2)ui.primary.disabled=true;if(['diagnose','contain','resolved'].includes(state.phase))ui.primary.disabled=true;if(state.phase==='closeout'&&closeDone<2)ui.primary.disabled=true;
    document.querySelectorAll('[data-tool]').forEach(btn=>{const tool=btn.dataset.tool,allowed=(tool==='inspect'&&state.phase==='investigate')||(['trap','barrier'].includes(tool)&&['prepare','contain'].includes(state.phase))||(['seal','clean'].includes(tool)&&state.phase==='closeout');btn.disabled=!allowed;btn.classList.toggle('selected',tool===state.selectedTool);});
    document.querySelectorAll('[data-species]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.species===state.diagnosis));const currentIndex=state.phase==='resolved'?phaseOrder.length:phaseOrder.indexOf(state.phase);document.querySelectorAll('#phaseTrack [data-phase]').forEach((item,index)=>{item.classList.toggle('done',index<currentIndex);item.classList.toggle('active',index===currentIndex);});
  }

  function drawHouse(now){
    ctx.fillStyle='#10272b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#d9caa7';ctx.beginPath();ctx.moveTo(225,57);ctx.lineTo(477,15);ctx.lineTo(730,57);ctx.closePath();ctx.fill();ctx.strokeStyle='#f2eddf';ctx.lineWidth=4;ctx.stroke();
    Object.values(rooms).forEach(r=>{const blocked=state.barriers.includes(r.id);ctx.fillStyle=r.color;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=blocked?'#d95045':'#f2eddf';ctx.lineWidth=blocked?7:4;ctx.strokeRect(r.x,r.y,r.w,r.h);if(state.hoverRoom===r.id&&['prepare','contain','closeout'].includes(state.phase)){ctx.fillStyle='rgba(77,182,176,.25)';ctx.fillRect(r.x,r.y,r.w,r.h);}if(state.phase==='contain'&&state.animal.moving&&state.animal.to===r.id){ctx.fillStyle=`rgba(238,127,69,${.15+Math.sin(now/110)*.05})`;ctx.fillRect(r.x,r.y,r.w,r.h);}ctx.fillStyle='#10272b';ctx.font='900 12px system-ui';ctx.fillText(r.label,r.x+12,r.y+21);if(blocked){ctx.fillStyle='#d95045';ctx.fillRect(r.x+12,r.y+r.h-31,86,20);ctx.fillStyle='#fff';ctx.font='800 10px system-ui';ctx.fillText('ROUTE BLOCKED',r.x+18,r.y+r.h-17);}});
    ctx.fillStyle='#775f45';ctx.fillRect(112,438,90,48);ctx.fillRect(510,450,90,28);ctx.fillStyle='#f2eddf';ctx.fillRect(291,245,90,48);ctx.fillStyle='#94a9b7';ctx.fillRect(298,252,76,34);ctx.fillStyle='#bd7659';ctx.fillRect(625,398,45,84);ctx.strokeStyle='#10272b';ctx.lineWidth=3;ctx.strokeRect(291,245,90,48);ctx.strokeRect(625,398,45,84);
    if(state.phase==='contain'){ctx.save();ctx.setLineDash([9,8]);ctx.lineWidth=3;ctx.strokeStyle='rgba(238,127,69,.58)';Object.entries(graph).forEach(([a,list])=>list.forEach(b=>{if(b==='outside'||a<b){const p=roomCenter(a),q=roomCenter(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}));ctx.restore();}
  }
  function drawEvidence(now){if(!['investigate','diagnose'].includes(state.phase))return;evidence.forEach((e,i)=>{const found=state.found.includes(e.id),pulse=1+Math.sin(now/250+i)*.08;ctx.beginPath();ctx.arc(e.x,e.y,found?11:14*pulse,0,Math.PI*2);ctx.fillStyle=found?'#4a8d68':'#eea54f';ctx.fill();ctx.strokeStyle='#10272b';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillText(found?'✓':'?',e.x,e.y+5);ctx.textAlign='left';if(state.hoverEvidence===e.id){const w=170,x=Math.min(e.x+18,canvas.width-w-8),y=e.y-38;ctx.fillStyle='#f2eddf';ctx.fillRect(x,y,w,32);ctx.strokeStyle='#10272b';ctx.strokeRect(x,y,w,32);ctx.fillStyle='#10272b';ctx.font='800 11px system-ui';ctx.fillText(found?e.title:'Inspect evidence',x+8,y+20);}});}
  function drawTools(){state.traps.forEach(id=>{const r=rooms[id],x=r.x+r.w-62,y=r.y+r.h-54;ctx.fillStyle='#f2eddf';ctx.fillRect(x,y,43,31);ctx.strokeStyle='#10272b';ctx.lineWidth=3;ctx.strokeRect(x,y,43,31);ctx.beginPath();for(let n=1;n<4;n++){ctx.moveTo(x+n*10,y);ctx.lineTo(x+n*10,y+31);}ctx.stroke();ctx.fillStyle='#10272b';ctx.font='900 9px system-ui';ctx.fillText(state.animal.captured?'SECURE':'TRAP',x+4,y-5);});}
  function drawCloseout(now){if(state.phase!=='closeout')return;const tasks=[{done:state.closeout.seal,room:'outside',label:'SEAL ENTRY'},{done:state.closeout.clean,room:state.incidents.nursery?'nursery':'attic',label:'HEPA CLEAN'}];tasks.forEach((task,index)=>{const p=roomCenter(task.room),radius=28+Math.sin(now/180+index)*3;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=task.done?'rgba(74,141,104,.82)':'rgba(238,127,69,.85)';ctx.fill();ctx.strokeStyle='#f2eddf';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(task.done?'DONE':task.label,p.x,p.y+4);ctx.textAlign='left';});}
  function drawAnimal(now){if(!['contain','closeout','resolved'].includes(state.phase)||state.animal.escaped)return;const a=state.animal,from=roomCenter(a.from),to=roomCenter(a.to);let t=a.moving?Math.min(1,(now-a.moveStart)/a.moveDuration):1;t=t*t*(3-2*t);const base=a.moving?from:roomCenter(a.room),x=a.moving?from.x+(to.x-from.x)*t:base.x,y=a.moving?from.y+(to.y-from.y)*t:base.y;ctx.save();ctx.translate(x,y);if(a.moving)ctx.rotate(Math.atan2(to.y-from.y,to.x-from.x));ctx.fillStyle='#343c3c';ctx.beginPath();ctx.ellipse(0,0,24,17,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(20,-5,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7d0bd';ctx.fillRect(15,-11,16,6);ctx.fillStyle='#10272b';ctx.beginPath();ctx.arc(25,-8,2,0,7);ctx.fill();ctx.strokeStyle='#343c3c';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-20,0);ctx.quadraticCurveTo(-42,-14,-50,4);ctx.stroke();ctx.strokeStyle='#d7d0bd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-34,-8);ctx.lineTo(-40,4);ctx.stroke();ctx.restore();}
  function draw(now=performance.now()){drawHouse(now);drawEvidence(now);drawTools();drawAnimal(now);drawCloseout(now);if(state.phase==='briefing'){ctx.fillStyle='rgba(16,39,43,.62)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f2eddf';ctx.font='900 27px system-ui';ctx.textAlign='center';ctx.fillText('UNKNOWN ACTIVITY — ATTIC',480,275);ctx.font='15px system-ui';ctx.fillText('Review the work order, then inspect the property.',480,308);ctx.textAlign='left';}if(state.phase==='contain'&&!state.animal.moving&&now>state.nextDecision)makeDecision(now);if(state.phase==='contain'&&state.animal.moving&&now-state.animal.moveStart>=state.animal.moveDuration)finishMove(now);requestAnimationFrame(draw);}
  function pointFromEvent(e){const box=canvas.getBoundingClientRect();return{x:(e.clientX-box.left)*canvas.width/box.width,y:(e.clientY-box.top)*canvas.height/box.height};}
  function hitRoom(p){return Object.values(rooms).find(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h);}
  function hitEvidence(p){return evidence.find(e=>Math.hypot(p.x-e.x,p.y-e.y)<25);}

  canvas.addEventListener('mousemove',e=>{const p=pointFromEvent(e),clue=hitEvidence(p),room=hitRoom(p);state.hoverEvidence=clue?.id||null;state.hoverRoom=room?.id||null;});
  canvas.addEventListener('mouseleave',()=>{state.hoverEvidence=null;state.hoverRoom=null;});
  canvas.addEventListener('click',e=>{const p=pointFromEvent(e),clue=hitEvidence(p),room=hitRoom(p);if(state.phase==='investigate'&&clue)inspectClue(clue);else if(room&&['prepare','contain','closeout'].includes(state.phase))placeTool(room.id);});
  ui.primary.addEventListener('click',()=>{if(state.phase==='briefing'){playCue('select');setPhase('investigate');}else if(state.phase==='investigate'&&state.found.length>=2)setPhase('diagnose');else if(state.phase==='prepare')startContainment();else if(state.phase==='closeout'&&state.closeout.seal&&state.closeout.clean)resolve(true);});
  document.querySelectorAll('[data-species]').forEach(b=>b.addEventListener('click',()=>chooseDiagnosis(b.dataset.species)));
  document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
  document.getElementById('restartButton').addEventListener('click',reset);document.getElementById('modalRestart').addEventListener('click',reset);document.getElementById('newSeedButton').addEventListener('click',()=>{location.search=`?seed=${Date.now().toString(36)}`;});
  ui.sound.addEventListener('click',()=>{soundEnabled=!soundEnabled;ui.sound.setAttribute('aria-pressed',String(soundEnabled));ui.sound.textContent=soundEnabled?'Sound on':'Sound off';if(soundEnabled)playCue('select');});
  ui.share.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);ui.share.textContent='Link copied';ui.shareStatus.textContent=`Copied this seeded job: ${state.seed}`;setTimeout(()=>ui.share.textContent='Copy job link',1800);}catch{ui.shareStatus.textContent=`Share this URL: ${location.href}`;}});
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')reset();if(['1','2','3','4','5'].includes(e.key))setTool(['','inspect','trap','barrier','seal','clean'][Number(e.key)]);if(e.code==='Space'&&state.phase==='prepare'){e.preventDefault();startContainment();}});
  reset();if(!animationStarted){animationStarted=true;requestAnimationFrame(draw);}
})();
