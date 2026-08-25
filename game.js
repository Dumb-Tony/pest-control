(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    phase: document.getElementById('phaseLabel'),
    damage: document.getElementById('damageLabel'),
    trust: document.getElementById('trustLabel'),
    budget: document.getElementById('budgetLabel'),
    objective: document.getElementById('objective'),
    instruction: document.getElementById('instruction'),
    caption: document.getElementById('canvasCaption'),
    primary: document.getElementById('primaryAction'),
    diagnosis: document.getElementById('diagnosisPanel'),
    tools: document.getElementById('toolsPanel'),
    inventory: document.getElementById('inventoryLabel'),
    evidenceCount: document.getElementById('evidenceCount'),
    log: document.getElementById('eventLog'),
    modal: document.getElementById('resultModal'),
    resultGrade: document.getElementById('resultGrade'),
    resultTitle: document.getElementById('resultTitle'),
    resultSummary: document.getElementById('resultSummary'),
    resultStats: document.getElementById('resultStats')
  };

  const rooms = {
    attic:   { id:'attic', label:'ATTIC', x:250, y:58,  w:455, h:105, color:'#695a46' },
    nursery: { id:'nursery', label:'NURSERY', x:250, y:178, w:220, h:155, color:'#d6aeb1' },
    hall:    { id:'hall', label:'UPSTAIRS HALL', x:485, y:178, w:220, h:155, color:'#d3bd84' },
    garage:  { id:'garage', label:'GARAGE', x:85,  y:348, w:290, h:170, color:'#8c9b91' },
    kitchen: { id:'kitchen', label:'KITCHEN', x:390, y:348, w:315, h:170, color:'#b9c98b' },
    outside: { id:'outside', label:'FRONT YARD / ESCAPE', x:720, y:348, w:155, h:170, color:'#638b74' }
  };

  const graph = {
    attic: ['nursery','garage'],
    nursery: ['attic','hall'],
    hall: ['nursery','kitchen','garage'],
    garage: ['attic','hall','kitchen'],
    kitchen: ['hall','garage','outside'],
    outside: []
  };

  const evidence = [
    { id:'tracks', room:'attic', x:390, y:118, title:'Hand-like tracks', detail:'Five long toes in the insulation. Much larger than rat prints.' },
    { id:'fur', room:'nursery', x:420, y:220, title:'Coarse dark fur', detail:'Caught on the ceiling crack beneath the attic.' },
    { id:'soffit', room:'outside', x:799, y:395, title:'Pried soffit', detail:'The aluminum edge was pulled outward by something dexterous.' },
    { id:'sound', room:'hall', x:600, y:250, title:'Heavy night movement', detail:'A slow thump-scrape after midnight, not light daytime skittering.' }
  ];

  const phaseNames = {
    briefing:'Briefing', investigate:'Investigation', diagnose:'Diagnosis',
    prepare:'Preparation', contain:'Live containment', resolved:'Job complete'
  };

  let state;

  function freshState() {
    return {
      phase:'briefing', selectedTool:'inspect', found:[], diagnosis:null,
      traps:[], barriers:[], damage:0, trust:100, budget:240,
      animal:{ room:'attic', previous:null, stress:10, captured:false, escaped:false,
        moving:false, from:'attic', to:'attic', moveStart:0, moveDuration:650 },
      simStarted:0, nextDecision:0, incidents:{ nursery:false, kitchen:false },
      log:[{ time:'22:14', text:'Dispatch: heavy attic noise, damaged soffit.' }],
      hoverRoom:null, hoverEvidence:null, resolved:false
    };
  }

  function reset() {
    state = freshState();
    ui.modal.hidden = true;
    updateUI();
    draw(performance.now());
  }

  function roomCenter(id) {
    const r = rooms[id];
    return { x:r.x + r.w/2, y:r.y + r.h/2 };
  }

  function log(text) {
    const seconds = state.phase === 'contain' ? Math.floor((performance.now()-state.simStarted)/1000) : 0;
    state.log.unshift({ time: seconds ? `+${String(seconds).padStart(2,'0')}s` : '22:—', text });
    state.log = state.log.slice(0, 10);
  }

  function setPhase(phase) {
    state.phase = phase;
    updateUI();
  }

  function inspectClue(item) {
    if (state.phase !== 'investigate' || state.found.includes(item.id)) return;
    state.found.push(item.id);
    log(`${item.title}: ${item.detail}`);
    ui.caption.textContent = item.detail;
    if (state.found.length === 2) log('Enough evidence to log a diagnosis. More clues improve confidence.');
    updateUI();
  }

  function chooseDiagnosis(species) {
    if (state.phase !== 'diagnose') return;
    state.diagnosis = species;
    if (species === 'raccoon') {
      log('Diagnosis confirmed: raccoon. Use a sturdy live trap and control its escape route.');
      state.trust = Math.min(100, state.trust + 2);
    } else {
      log(`Diagnosis logged as ${species}. The evidence does not fit; the attic animal is already agitated.`);
      state.trust -= 10;
      state.animal.stress = 38;
    }
    setPhase('prepare');
  }

  function placeTool(roomId) {
    if (!['prepare','contain'].includes(state.phase)) return;
    if (roomId === 'outside' || roomId === 'attic' && state.selectedTool === 'barrier') {
      ui.caption.textContent = roomId === 'outside' ? 'The yard cannot hold placed equipment.' : 'You cannot seal the animal inside the attic.';
      return;
    }
    if (state.selectedTool === 'trap') {
      if (state.traps.length >= 1) { ui.caption.textContent = 'Only one suitable live trap is on the van.'; return; }
      if (state.budget < 55) return;
      state.traps.push(roomId); state.budget -= 55;
      log(`Live trap armed in ${rooms[roomId].label.toLowerCase()}.`);
      ui.caption.textContent = roomId === 'garage' ? 'Good: quiet, near the attic route, and away from occupants.' : 'The trap is armed, but consider the animal’s likely route.';
    } else if (state.selectedTool === 'barrier') {
      if (state.barriers.length >= 3) { ui.caption.textContent = 'All three temporary barriers are deployed.'; return; }
      if (state.barriers.includes(roomId)) { ui.caption.textContent = 'That route is already blocked.'; return; }
      if (state.animal.room === roomId && state.phase === 'contain') { ui.caption.textContent = 'Too late—the raccoon is already in that room.'; return; }
      if (state.budget < 25) return;
      state.barriers.push(roomId); state.budget -= 25;
      log(`${state.phase === 'contain' ? 'Emergency b' : 'B'}arrier placed across ${rooms[roomId].label.toLowerCase()} route.`);
    }
    updateUI();
  }

  function startContainment() {
    if (state.phase !== 'prepare') return;
    if (!state.traps.length) { ui.caption.textContent = 'Place the live trap before disturbing the attic.'; return; }
    state.phase = 'contain';
    state.simStarted = performance.now();
    state.nextDecision = state.simStarted + 1050;
    log('Containment started. Footsteps in the attic—watch the route and be ready to react.');
    ui.caption.textContent = 'SCRATCH—THUMP. The raccoon is choosing a way out.';
    updateUI();
  }

  function scoreDestination(from, id) {
    let score = 0;
    if (id === 'outside') score += 125;
    if (id === 'nursery') score += from === 'attic' ? 62 : 10;
    if (id === 'hall') score += 38;
    if (id === 'kitchen') score += 58;
    if (id === 'garage') score += 18;
    // Bait influences a route, but does not override a raccoon's preference for an
    // apparently open escape. Preparation must shape the graph around the trap.
    if (state.traps.includes(id)) score += state.diagnosis === 'raccoon' ? 35 : 8;
    if (id === state.animal.previous) score -= 36;
    if (id === 'nursery' && state.incidents.nursery) score -= 8;
    score += Math.min(24, state.animal.stress * .25);
    return score;
  }

  function makeDecision(now) {
    const a = state.animal;
    const options = graph[a.room].filter(id => !state.barriers.includes(id));
    if (!options.length) {
      state.damage += 90; state.trust -= 18; a.stress += 22;
      log(`Cornered in ${rooms[a.room].label.toLowerCase()}: clawing damages trim while the raccoon searches again.`);
      if (state.barriers.length) state.barriers.pop();
      log('The last temporary barrier buckles under pressure.');
      state.nextDecision = now + 1250;
      updateUI();
      return;
    }
    options.sort((x,y) => scoreDestination(a.room,y) - scoreDestination(a.room,x));
    const target = options[0];
    a.previous = a.room; a.from = a.room; a.to = target; a.moving = true; a.moveStart = now;
    ui.caption.textContent = `Movement: ${rooms[a.room].label.toLowerCase()} → ${rooms[target].label.toLowerCase()}.`;
  }

  function finishMove(now) {
    const a = state.animal;
    a.room = a.to; a.moving = false; a.stress += 8;

    if (a.room === 'nursery' && !state.incidents.nursery) {
      state.incidents.nursery = true; state.damage += 180; state.trust -= 22;
      log('CEILING BREACH: the raccoon drops into the occupied nursery. Damage +$180, trust −22.');
      ui.caption.textContent = 'The blocked attic route redirected it through weak plaster. You can still cut off the kitchen.';
    }
    if (a.room === 'kitchen' && !state.incidents.kitchen) {
      state.incidents.kitchen = true; state.damage += 125; state.trust -= 16;
      log('KITCHEN RAID: food and dishes hit the floor. Damage +$125, trust −16.');
    }
    if (state.traps.includes(a.room)) {
      if (state.diagnosis === 'raccoon') {
        a.captured = true;
        log(`Trap secured in ${rooms[a.room].label.toLowerCase()}. Animal ready for safe removal.`);
        resolve(true); return;
      }
      state.traps = [];
      state.damage += 35; state.trust -= 8; a.stress += 22;
      log('WRONG-SIZE TRAP: the door snaps early. The animal bolts; damage +$35, trust −8.');
    }
    if (a.room === 'outside') {
      a.escaped = true;
      log('The raccoon reaches the open front walk and disappears into the neighborhood.');
      resolve(false); return;
    }
    if (state.damage >= 650 || state.trust <= 0) {
      log('The customer stops the job after escalating damage.');
      resolve(false); return;
    }
    state.nextDecision = now + 900;
    updateUI();
  }

  function resolve(captured) {
    state.phase = 'resolved'; state.resolved = true;
    const trust = Math.max(0, state.trust);
    let grade = captured ? (state.damage === 0 && trust >= 90 ? 'A' : state.damage < 250 && trust >= 60 ? 'B' : 'C') : 'D';
    if (!captured && trust < 35) grade = 'F';
    ui.resultGrade.textContent = grade;
    ui.resultTitle.textContent = captured ? 'Animal secured' : 'Animal escaped';
    ui.resultSummary.textContent = captured
      ? (state.incidents.nursery ? 'The containment broke down, but you read the new route and recovered. The crew still has repairs to explain.' : 'The evidence and preparation lined up. The raccoon entered the live trap without reaching an occupied room.')
      : 'The route stayed open through the house. The event log shows the chain so the next attempt can be planned differently.';
    ui.resultStats.innerHTML = `<div><small>Damage</small><strong>$${state.damage}</strong></div><div><small>Trust</small><strong>${trust}</strong></div><div><small>Supplies</small><strong>$${state.budget}</strong></div>`;
    updateUI();
    setTimeout(() => { ui.modal.hidden = false; document.getElementById('modalRestart').focus(); }, 500);
  }

  function setTool(tool) {
    if (tool === 'inspect' && state.phase !== 'investigate') return;
    if (['trap','barrier'].includes(tool) && !['prepare','contain'].includes(state.phase)) return;
    state.selectedTool = tool; updateUI();
  }

  function updateUI() {
    ui.phase.textContent = phaseNames[state.phase];
    ui.damage.textContent = `$${state.damage}`;
    ui.trust.textContent = Math.max(0, state.trust);
    ui.budget.textContent = `$${state.budget}`;
    ui.evidenceCount.textContent = `${state.found.length} / ${evidence.length} clues`;
    ui.inventory.textContent = `Trap ${state.traps.length}/1 · Barriers ${state.barriers.length}/3`;
    ui.log.innerHTML = state.log.map(item => `<li><strong>${item.time}</strong> — ${item.text}</li>`).join('');

    ui.diagnosis.hidden = state.phase !== 'diagnose';
    ui.tools.hidden = !['investigate','prepare','contain'].includes(state.phase);
    ui.primary.hidden = false;
    ui.primary.disabled = false;

    const copy = {
      briefing:['Review the call','Mrs. Alvarez heard heavy movement above the nursery after midnight. Identify the animal, prepare a safe route, and remove it.','Accept job'],
      investigate:['Collect evidence','Click the amber evidence markers. Two clues are enough to diagnose; four give the clearest picture.', state.found.length >= 2 ? 'Log diagnosis' : `Find ${2-state.found.length} more clue${state.found.length===1?'':'s'}`],
      diagnose:['Name the animal','Compare the clues, then commit to a working diagnosis. The choice affects trap effectiveness.','Choose a species below'],
      prepare:['Shape a safe route','Place one live trap and up to three barriers. The garage is quiet; the nursery is occupied.','Start containment'],
      contain:['Contain and recover','The animal re-evaluates after every move. Place emergency barriers ahead of it if the route deteriorates.','Containment active'],
      resolved:['Job closed','Review the event chain and adjust the plan for another run.','Job complete']
    }[state.phase];
    [ui.objective.textContent, ui.instruction.textContent, ui.primary.textContent] = copy;
    if (state.phase === 'investigate' && state.found.length < 2) ui.primary.disabled = true;
    if (['diagnose','contain','resolved'].includes(state.phase)) ui.primary.disabled = true;

    document.querySelectorAll('[data-tool]').forEach(btn => {
      const allowed = btn.dataset.tool === 'inspect' ? state.phase === 'investigate' : ['prepare','contain'].includes(state.phase);
      btn.disabled = !allowed;
      btn.classList.toggle('selected', btn.dataset.tool === state.selectedTool);
    });
    document.querySelectorAll('[data-species]').forEach(btn => btn.classList.toggle('selected', btn.dataset.species === state.diagnosis));
  }

  function drawHouse() {
    ctx.fillStyle = '#10272b'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#d9caa7';
    ctx.beginPath(); ctx.moveTo(225,57); ctx.lineTo(477,15); ctx.lineTo(730,57); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f2eddf'; ctx.lineWidth = 4; ctx.stroke();

    Object.values(rooms).forEach(r => {
      const blocked = state.barriers.includes(r.id);
      ctx.fillStyle = r.color; ctx.fillRect(r.x,r.y,r.w,r.h);
      ctx.strokeStyle = blocked ? '#d95045' : '#f2eddf'; ctx.lineWidth = blocked ? 7 : 4; ctx.strokeRect(r.x,r.y,r.w,r.h);
      if (state.hoverRoom === r.id && ['prepare','contain'].includes(state.phase)) {
        ctx.fillStyle = 'rgba(77,182,176,.25)'; ctx.fillRect(r.x,r.y,r.w,r.h);
      }
      ctx.fillStyle = '#10272b'; ctx.font = '900 12px system-ui'; ctx.fillText(r.label, r.x+12, r.y+21);
      if (blocked) {
        ctx.fillStyle = '#d95045'; ctx.fillRect(r.x+12,r.y+r.h-31,86,20);
        ctx.fillStyle = '#fff'; ctx.font = '800 10px system-ui'; ctx.fillText('ROUTE BLOCKED',r.x+18,r.y+r.h-17);
      }
    });

    // Context props
    ctx.fillStyle='#775f45'; ctx.fillRect(112,438,90,48); ctx.fillRect(510,450,90,28);
    ctx.fillStyle='#f2eddf'; ctx.fillRect(291,245,90,48); ctx.fillStyle='#94a9b7'; ctx.fillRect(298,252,76,34);
    ctx.fillStyle='#bd7659'; ctx.fillRect(625,398,45,84);
    ctx.strokeStyle='#10272b'; ctx.lineWidth=3; ctx.strokeRect(291,245,90,48); ctx.strokeRect(625,398,45,84);

    // Route lines during containment
    if (state.phase === 'contain') {
      ctx.save(); ctx.setLineDash([9,8]); ctx.lineWidth=3; ctx.strokeStyle='rgba(238,127,69,.7)';
      Object.entries(graph).forEach(([a,list]) => list.forEach(b => {
        if (b==='outside' || a < b) { const p=roomCenter(a), q=roomCenter(b); ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke(); }
      })); ctx.restore();
    }
  }

  function drawEvidence(now) {
    if (!['investigate','diagnose'].includes(state.phase)) return;
    evidence.forEach((e,i) => {
      const found = state.found.includes(e.id);
      const pulse = 1 + Math.sin(now/250+i)*.08;
      ctx.beginPath(); ctx.arc(e.x,e.y, found ? 11 : 14*pulse, 0, Math.PI*2);
      ctx.fillStyle = found ? '#4a8d68' : '#eea54f'; ctx.fill();
      ctx.strokeStyle='#10272b'; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='900 13px system-ui'; ctx.textAlign='center'; ctx.fillText(found?'✓':'?',e.x,e.y+5); ctx.textAlign='left';
      if (state.hoverEvidence===e.id) {
        const w=170, x=Math.min(e.x+18,canvas.width-w-8), y=e.y-38;
        ctx.fillStyle='#f2eddf'; ctx.fillRect(x,y,w,32); ctx.strokeStyle='#10272b'; ctx.strokeRect(x,y,w,32);
        ctx.fillStyle='#10272b'; ctx.font='800 11px system-ui'; ctx.fillText(found ? e.title : 'Inspect evidence',x+8,y+20);
      }
    });
  }

  function drawTools() {
    state.traps.forEach(id => {
      const r=rooms[id], x=r.x+r.w-62, y=r.y+r.h-54;
      ctx.fillStyle='#f2eddf'; ctx.fillRect(x,y,43,31); ctx.strokeStyle='#10272b'; ctx.lineWidth=3; ctx.strokeRect(x,y,43,31);
      ctx.beginPath(); for(let n=1;n<4;n++){ctx.moveTo(x+n*10,y);ctx.lineTo(x+n*10,y+31);} ctx.stroke();
      ctx.fillStyle='#10272b'; ctx.font='900 9px system-ui'; ctx.fillText('TRAP',x+8,y-5);
    });
  }

  function drawAnimal(now) {
    if (!['contain','resolved'].includes(state.phase) || state.animal.escaped) return;
    const a=state.animal, from=roomCenter(a.from), to=roomCenter(a.to);
    let t=a.moving ? Math.min(1,(now-a.moveStart)/a.moveDuration) : 1;
    t = t*t*(3-2*t);
    const base = a.moving ? from : roomCenter(a.room);
    const x = a.moving ? from.x+(to.x-from.x)*t : base.x;
    const y = a.moving ? from.y+(to.y-from.y)*t : base.y;
    ctx.save(); ctx.translate(x,y); if(a.moving) ctx.rotate(Math.atan2(to.y-from.y,to.x-from.x));
    ctx.fillStyle='#343c3c'; ctx.beginPath(); ctx.ellipse(0,0,24,17,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(20,-5,14,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#d7d0bd'; ctx.fillRect(15,-11,16,6); ctx.fillStyle='#10272b'; ctx.beginPath();ctx.arc(25,-8,2,0,7);ctx.fill();
    ctx.strokeStyle='#343c3c';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-20,0);ctx.quadraticCurveTo(-42,-14,-50,4);ctx.stroke();
    ctx.strokeStyle='#d7d0bd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-34,-8);ctx.lineTo(-40,4);ctx.stroke();
    ctx.restore();
  }

  function draw(now=performance.now()) {
    drawHouse(); drawEvidence(now); drawTools(); drawAnimal(now);
    if (state.phase === 'briefing') {
      ctx.fillStyle='rgba(16,39,43,.62)';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#f2eddf';ctx.font='900 27px system-ui';ctx.textAlign='center';ctx.fillText('UNKNOWN ACTIVITY — ATTIC',480,275);
      ctx.font='15px system-ui';ctx.fillText('Review the work order, then inspect the property.',480,308);ctx.textAlign='left';
    }
    if (state.phase === 'contain' && !state.animal.moving && performance.now() > state.nextDecision) makeDecision(performance.now());
    if (state.phase === 'contain' && state.animal.moving && performance.now()-state.animal.moveStart >= state.animal.moveDuration) finishMove(performance.now());
    requestAnimationFrame(draw);
  }

  function pointFromEvent(e) {
    const box=canvas.getBoundingClientRect();
    return { x:(e.clientX-box.left)*canvas.width/box.width, y:(e.clientY-box.top)*canvas.height/box.height };
  }

  function hitRoom(p) { return Object.values(rooms).find(r => p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h); }
  function hitEvidence(p) { return evidence.find(e => Math.hypot(p.x-e.x,p.y-e.y)<25); }

  canvas.addEventListener('mousemove', e => {
    const p=pointFromEvent(e), clue=hitEvidence(p), room=hitRoom(p);
    state.hoverEvidence=clue?.id||null; state.hoverRoom=room?.id||null;
  });
  canvas.addEventListener('mouseleave',()=>{state.hoverEvidence=null;state.hoverRoom=null;});
  canvas.addEventListener('click', e => {
    const p=pointFromEvent(e), clue=hitEvidence(p), room=hitRoom(p);
    if (state.phase==='investigate' && clue) inspectClue(clue);
    else if (room && ['prepare','contain'].includes(state.phase)) placeTool(room.id);
  });

  ui.primary.addEventListener('click', () => {
    if (state.phase==='briefing') setPhase('investigate');
    else if (state.phase==='investigate' && state.found.length>=2) setPhase('diagnose');
    else if (state.phase==='prepare') startContainment();
  });
  document.querySelectorAll('[data-species]').forEach(b=>b.addEventListener('click',()=>chooseDiagnosis(b.dataset.species)));
  document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
  document.getElementById('restartButton').addEventListener('click', reset);
  document.getElementById('modalRestart').addEventListener('click', reset);
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase()==='r') reset();
    if (e.key==='1') setTool('inspect');
    if (e.key==='2') setTool('trap');
    if (e.key==='3') setTool('barrier');
    if (e.code==='Space' && state.phase==='prepare') { e.preventDefault(); startContainment(); }
  });

  reset();
})();
