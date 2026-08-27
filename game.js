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

  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function line(x1,y1,x2,y2,width=3,color='#10272b'){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
  function drawWorld(now){
    const sky=ctx.createLinearGradient(0,0,0,600);sky.addColorStop(0,'#17363d');sky.addColorStop(.55,'#28565b');sky.addColorStop(1,'#63806a');ctx.fillStyle=sky;ctx.fillRect(0,0,960,600);
    ctx.fillStyle='rgba(244,221,160,.75)';ctx.beginPath();ctx.arc(92,82,31,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(23,54,61,.95)';ctx.beginPath();ctx.arc(105,70,31,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(242,237,223,.18)';for(let i=0;i<8;i++){const x=(77+i*139)%940,y=38+(i%3)*31;ctx.beginPath();ctx.arc(x,y,2+(i%2),0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#244d45';for(const x of [25,760,900]){ctx.beginPath();ctx.moveTo(x,348);ctx.lineTo(x+43,190);ctx.lineTo(x+86,348);ctx.fill();ctx.beginPath();ctx.moveTo(x+16,348);ctx.lineTo(x+56,235);ctx.lineTo(x+99,348);ctx.fill();}
    ctx.fillStyle='#476753';ctx.fillRect(0,520,960,80);ctx.fillStyle='#3a5848';for(let x=0;x<960;x+=34){ctx.beginPath();ctx.arc(x,522+(x%3)*3,28,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='rgba(13,34,36,.38)';ctx.beginPath();ctx.ellipse(480,538,395,28,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;for(let y=0;y<600;y+=8)line(0,y,960,y,1,'rgba(255,255,255,.025)');
  }
  function drawRoomShell(r,now){
    const blocked=state.barriers.includes(r.id),gradient=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);gradient.addColorStop(0,r.color);gradient.addColorStop(1,'#756f5f');
    ctx.save();ctx.shadowColor='rgba(4,18,19,.48)';ctx.shadowBlur=15;ctx.shadowOffsetY=8;ctx.fillStyle=gradient;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.restore();
    ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(r.x+5,r.y+5,r.w-10,22);ctx.fillStyle='rgba(8,25,27,.16)';ctx.fillRect(r.x+5,r.y+r.h-22,r.w-10,17);
    ctx.strokeStyle=blocked?'#e55447':'#d9caa7';ctx.lineWidth=blocked?8:5;ctx.strokeRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle='rgba(16,39,43,.55)';ctx.lineWidth=2;ctx.strokeRect(r.x+6,r.y+6,r.w-12,r.h-12);
    if(state.hoverRoom===r.id&&['prepare','contain','closeout'].includes(state.phase)){ctx.fillStyle='rgba(77,182,176,.24)';ctx.fillRect(r.x+5,r.y+5,r.w-10,r.h-10);}
    if(state.phase==='contain'&&state.animal.moving&&state.animal.to===r.id){ctx.fillStyle=`rgba(238,127,69,${.13+Math.sin(now/110)*.05})`;ctx.fillRect(r.x+5,r.y+5,r.w-10,r.h-10);}
    ctx.fillStyle='#10272b';roundedRect(r.x+10,r.y+9,Math.min(118,r.w-20),22,3);ctx.fill();ctx.fillStyle='#f2eddf';ctx.font='900 11px system-ui';ctx.fillText(r.label,r.x+18,r.y+24);
    if(blocked){ctx.fillStyle='#d95045';roundedRect(r.x+12,r.y+r.h-36,102,23,3);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.fillText('✕ ROUTE BLOCKED',r.x+20,r.y+r.h-20);}
  }
  function drawRoomProps(){
    // Attic: rafters, insulation, boxes, and the damaged soffit line.
    line(275,145,350,76,5,'rgba(58,47,37,.8)');line(680,145,610,76,5,'rgba(58,47,37,.8)');line(330,76,630,76,4,'rgba(58,47,37,.8)');
    ctx.fillStyle='#9d7c4d';ctx.fillRect(292,116,47,29);ctx.fillStyle='#c19b61';ctx.fillRect(347,126,37,19);line(292,125,339,125,2,'#69553d');line(315,116,315,145,2,'#69553d');
    ctx.strokeStyle='rgba(242,237,223,.28)';ctx.lineWidth=3;for(let x=405;x<650;x+=24){ctx.beginPath();ctx.arc(x,139,12,Math.PI,0);ctx.stroke();}
    // Nursery: crib, rug, moon mobile, toy blocks.
    ctx.fillStyle='#e8dac4';roundedRect(282,250,112,51,4);ctx.fill();ctx.strokeStyle='#5d5147';ctx.lineWidth=4;ctx.stroke();for(let x=293;x<390;x+=15)line(x,254,x,294,2,'#857567');
    ctx.fillStyle='rgba(91,113,124,.35)';ctx.beginPath();ctx.ellipse(397,304,48,16,0,0,Math.PI*2);ctx.fill();line(420,194,420,226,2,'#5c5149');ctx.fillStyle='#ead493';ctx.beginPath();ctx.arc(410,229,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e88962';ctx.fillRect(434,290,14,14);ctx.fillStyle='#6a95a4';ctx.fillRect(415,296,13,10);
    // Hall: stair rail, runner, framed local landscape.
    ctx.fillStyle='rgba(126,74,55,.42)';roundedRect(514,294,160,18,6);ctx.fill();line(555,215,555,292,4,'#58483d');for(let x=560;x<680;x+=18)line(x,238,x,292,2,'#58483d');line(553,238,682,238,4,'#58483d');ctx.fillStyle='#d9caa7';ctx.fillRect(620,206,54,37);ctx.fillStyle='#668b78';ctx.fillRect(626,212,42,25);line(626,229,645,216,2,'#d9caa7');line(645,216,668,229,2,'#d9caa7');
    // Garage: pegboard, workbench, storage, tire.
    ctx.fillStyle='#977e5d';ctx.fillRect(111,380,118,44);ctx.fillStyle='#d0b17c';ctx.fillRect(111,372,118,12);for(let x=121;x<220;x+=16){ctx.fillStyle='rgba(16,39,43,.28)';ctx.beginPath();ctx.arc(x,394,2,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#554b42';ctx.fillRect(119,430,100,15);ctx.fillStyle='#2e3737';ctx.beginPath();ctx.arc(320,476,27,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8c9b91';ctx.beginPath();ctx.arc(320,476,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c27c47';ctx.fillRect(246,458,38,43);line(246,470,284,470,2,'#5c493a');
    // Kitchen: cabinets, sink, table, fridge, scattered breakables.
    ctx.fillStyle='#e4d7bb';ctx.fillRect(414,379,185,37);ctx.fillStyle='#826a55';ctx.fillRect(414,416,185,55);for(let x=420;x<590;x+=43){ctx.strokeStyle='#56483d';ctx.strokeRect(x,421,37,45);}ctx.fillStyle='#91a7a5';ctx.fillRect(480,385,52,12);line(505,386,505,374,4,'#536b69');ctx.fillStyle='#d8d0bd';roundedRect(625,378,53,106,4);ctx.fill();ctx.strokeStyle='#554b42';ctx.lineWidth=3;ctx.stroke();line(625,420,678,420,2,'#554b42');ctx.fillStyle='#755f49';roundedRect(485,475,92,22,7);ctx.fill();line(498,497,494,516,5,'#554b42');line(563,497,568,516,5,'#554b42');
    // Exterior: porch, mailbox, bins, shrub, soffit damage.
    ctx.fillStyle='#b78f67';ctx.fillRect(736,473,126,15);ctx.fillStyle='#76614b';for(let x=742;x<858;x+=15)line(x,474,x,487,2,'#4e4035');line(758,391,758,473,6,'#d1b38a');line(846,391,846,473,6,'#d1b38a');ctx.fillStyle='#e4d7bb';ctx.fillRect(768,391,69,82);ctx.fillStyle='#795340';ctx.fillRect(781,408,43,65);ctx.fillStyle='#e6b75b';ctx.beginPath();ctx.arc(816,441,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#405d50';ctx.fillRect(724,452,28,51);ctx.fillStyle='#2c4943';ctx.fillRect(848,448,22,55);ctx.fillStyle='#d95045';ctx.beginPath();ctx.moveTo(788,358);ctx.lineTo(819,349);ctx.lineTo(830,361);ctx.lineTo(800,369);ctx.closePath();ctx.fill();
  }
  function drawHouse(now){
    drawWorld(now);
    ctx.save();ctx.shadowColor='rgba(5,19,20,.55)';ctx.shadowBlur=22;ctx.shadowOffsetY=12;ctx.fillStyle='#b58f65';ctx.fillRect(77,337,807,198);ctx.restore();
    ctx.fillStyle='#8d684a';ctx.beginPath();ctx.moveTo(218,63);ctx.lineTo(477,8);ctx.lineTo(740,63);ctx.lineTo(710,82);ctx.lineTo(477,34);ctx.lineTo(246,82);ctx.closePath();ctx.fill();ctx.strokeStyle='#392f2a';ctx.lineWidth=6;ctx.stroke();
    for(let x=250;x<705;x+=34)line(x,63,x+14,56,2,'rgba(231,205,157,.34)');
    Object.values(rooms).forEach(r=>drawRoomShell(r,now));drawRoomProps();
    if(state.incidents.nursery){ctx.fillStyle='rgba(34,27,24,.78)';ctx.beginPath();ctx.moveTo(350,178);ctx.lineTo(374,178);ctx.lineTo(387,193);ctx.lineTo(372,201);ctx.lineTo(356,192);ctx.closePath();ctx.fill();line(356,183,340,213,3,'#d95045');}
    if(state.incidents.kitchen){ctx.fillStyle='#e8dac4';for(const [x,y] of [[555,494],[603,482],[521,508]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+9,y-9);ctx.lineTo(x+15,y+4);ctx.closePath();ctx.fill();}ctx.fillStyle='rgba(175,91,55,.5)';ctx.beginPath();ctx.ellipse(594,509,29,8,0,0,Math.PI*2);ctx.fill();}
    if(state.phase==='contain'){ctx.save();ctx.setLineDash([10,8]);ctx.lineWidth=4;ctx.strokeStyle='rgba(245,172,81,.72)';Object.entries(graph).forEach(([a,list])=>list.forEach(b=>{if(b==='outside'||a<b){const p=roomCenter(a),q=roomCenter(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}));ctx.restore();}
  }
  function drawEvidence(now){
    if(!['investigate','diagnose'].includes(state.phase))return;
    const icons={tracks:'♟',fur:'≈',soffit:'!',sound:'◖'};
    evidence.forEach((e,i)=>{const found=state.found.includes(e.id),pulse=1+Math.sin(now/250+i)*.08;ctx.save();ctx.shadowColor=found?'rgba(74,141,104,.75)':'rgba(238,165,79,.85)';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(e.x,e.y,found?13:16*pulse,0,Math.PI*2);ctx.fillStyle=found?'#4a8d68':'#efa14b';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#f2eddf';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#10272b';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText(found?'✓':icons[e.id],e.x,e.y+5);ctx.textAlign='left';ctx.restore();if(state.hoverEvidence===e.id){const w=186,x=Math.min(e.x+20,canvas.width-w-8),y=e.y-43;ctx.save();ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=10;ctx.fillStyle='#f2eddf';roundedRect(x,y,w,36,4);ctx.fill();ctx.restore();ctx.strokeStyle='#10272b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#10272b';ctx.font='900 11px system-ui';ctx.fillText(found?e.title:'INSPECT EVIDENCE',x+10,y+22);}}
    );
  }
  function drawTools(){state.traps.forEach(id=>{const r=rooms[id],x=r.x+r.w-74,y=r.y+r.h-62;ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=7;ctx.shadowOffsetY=4;ctx.fillStyle='#d9caa7';roundedRect(x,y,54,38,3);ctx.fill();ctx.restore();ctx.strokeStyle='#273b3d';ctx.lineWidth=4;ctx.stroke();for(let n=1;n<5;n++)line(x+n*10,y+3,x+n*10,y+35,2,'#526568');ctx.fillStyle=state.animal.captured?'#4a8d68':'#ee7f45';roundedRect(x-2,y-20,58,17,3);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 9px system-ui';ctx.fillText(state.animal.captured?'SECURED':'LIVE TRAP',x+5,y-8);});}
  function drawCloseout(now){if(state.phase!=='closeout')return;const tasks=[{done:state.closeout.seal,room:'outside',label:'SEAL ENTRY'},{done:state.closeout.clean,room:state.incidents.nursery?'nursery':'attic',label:'HEPA CLEAN'}];tasks.forEach((task,index)=>{const p=roomCenter(task.room),radius=30+Math.sin(now/180+index)*3;ctx.save();ctx.shadowColor=task.done?'#4a8d68':'#ee7f45';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=task.done?'rgba(74,141,104,.92)':'rgba(238,127,69,.94)';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#f2eddf';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(task.done?'✓ DONE':task.label,p.x,p.y+4);ctx.textAlign='left';ctx.restore();});}
  function drawAnimal(now){
    if(!['contain','closeout','resolved'].includes(state.phase)||state.animal.escaped)return;
    const a=state.animal,from=roomCenter(a.from),to=roomCenter(a.to);let t=a.moving?Math.min(1,(now-a.moveStart)/a.moveDuration):1;t=t*t*(3-2*t);const base=a.moving?from:roomCenter(a.room),x=a.moving?from.x+(to.x-from.x)*t:base.x,y=a.moving?from.y+(to.y-from.y)*t:base.y,bob=a.moving?Math.sin(now/45)*3:Math.sin(now/260)*1.5;
    ctx.save();ctx.translate(x,y+bob);if(a.moving)ctx.rotate(Math.atan2(to.y-from.y,to.x-from.x));ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=8;ctx.shadowOffsetY=5;ctx.fillStyle='#465254';ctx.beginPath();ctx.ellipse(0,0,29,19,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#3a4446';ctx.beginPath();ctx.arc(24,-7,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7d0bd';ctx.beginPath();ctx.ellipse(27,-8,13,7,-.1,0,Math.PI*2);ctx.fill();ctx.fillStyle='#202c2d';ctx.beginPath();ctx.arc(31,-9,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f2eddf';ctx.beginPath();ctx.arc(32,-10,1,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a4446';ctx.beginPath();ctx.moveTo(14,-19);ctx.lineTo(20,-31);ctx.lineTo(27,-20);ctx.fill();ctx.beginPath();ctx.moveTo(31,-20);ctx.lineTo(38,-29);ctx.lineTo(42,-15);ctx.fill();ctx.strokeStyle='#465254';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-24,0);ctx.quadraticCurveTo(-51,-17,-61,6);ctx.stroke();ctx.strokeStyle='#d7d0bd';ctx.lineWidth=4;for(const n of [0,1,2]){ctx.beginPath();ctx.moveTo(-37-n*8,-7+n*2);ctx.lineTo(-42-n*7,6+n*1);ctx.stroke();}ctx.fillStyle='#30393a';for(const lx of [-15,11]){ctx.beginPath();ctx.ellipse(lx,17,9,4,0,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
  function draw(now=performance.now()){
    drawHouse(now);drawEvidence(now);drawTools();drawAnimal(now);drawCloseout(now);
    if(state.phase==='briefing'){ctx.fillStyle='rgba(8,28,31,.48)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=18;ctx.fillStyle='#f2eddf';roundedRect(262,242,436,96,6);ctx.fill();ctx.restore();ctx.fillStyle='#ee7f45';ctx.fillRect(262,242,12,96);ctx.fillStyle='#10272b';ctx.font='900 26px system-ui';ctx.textAlign='center';ctx.fillText('UNKNOWN ACTIVITY — ATTIC',487,282);ctx.font='700 14px system-ui';ctx.fillStyle='#526063';ctx.fillText('Review the work order, then inspect the property.',487,309);ctx.textAlign='left';}
    if(state.phase==='contain'&&!state.animal.moving&&now>state.nextDecision)makeDecision(now);if(state.phase==='contain'&&state.animal.moving&&now-state.animal.moveStart>=state.animal.moveDuration)finishMove(now);requestAnimationFrame(draw);
  }
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
