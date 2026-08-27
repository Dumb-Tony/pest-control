import * as THREE from 'three';

const ROOM_POSITIONS={
  attic:new THREE.Vector3(0,3.65,0),nursery:new THREE.Vector3(-3.5,.12,-2.45),hall:new THREE.Vector3(1.5,.12,-1.1),
  garage:new THREE.Vector3(-3.5,.12,2.55),kitchen:new THREE.Vector3(2.5,.12,2.55),outside:new THREE.Vector3(2.45,.08,6.7)
};
const PALETTE={ink:0x142e31,cream:0xeadfca,plaster:0xd7c9ae,timber:0x775844,orange:0xe87e45,amber:0xf4b35d,teal:0x4ea9a0,green:0x4f8b68,red:0xc85443,metal:0x59686a,dark:0x27383a};
const UP=new THREE.Vector3(0,1,0);

function clay(color,options={}){const settings={color,roughness:options.roughness??.94,metalness:options.metalness??0,flatShading:options.flatShading??true,emissive:options.emissive??0,emissiveIntensity:options.emissiveIntensity??0};if(options.transparent!==undefined)settings.transparent=options.transparent;if(options.opacity!==undefined)settings.opacity=options.opacity;return new THREE.MeshStandardMaterial(settings);}
function mesh(geometry,material,position,rotation){const item=new THREE.Mesh(geometry,material);if(position)item.position.set(...position);if(rotation)item.rotation.set(...rotation);item.castShadow=true;item.receiveShadow=true;return item;}
function addBox(group,size,color,position,rotation,options){const item=mesh(new THREE.BoxGeometry(...size,2,2,2),clay(color,options),position,rotation);group.add(item);return item;}
function addCylinder(group,top,bottom,height,color,position,rotation){const item=mesh(new THREE.CylinderGeometry(top,bottom,height,10),clay(color),position,rotation);group.add(item);return item;}
function makeLabel(text,color='#f4eddd',background='#142e31'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.roundRect(10,10,492,108,24);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=7;ctx.stroke();ctx.fillStyle=color;ctx.font='900 42px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,65);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(2.15,.54,1);return sprite;
}

function buildTechnician(){
  const tech=new THREE.Group();
  addCylinder(tech,.34,.42,.92,0x315d52,[0,1.02,0]);
  addBox(tech,[.58,.7,.26],0xd7803e,[0,1.05,.3],[-.05,0,0]);
  addCylinder(tech,.27,.29,.42,0xbc8063,[0,1.72,0]);
  addCylinder(tech,.33,.29,.16,0xe5a646,[0,1.95,0]);
  addBox(tech,[.32,.08,.42],0xe5a646,[0,1.91,-.18],[.08,0,0]);
  for(const x of[-.19,.19]){addCylinder(tech,.11,.13,.75,0x2d4645,[x,.34,0]);addBox(tech,[.3,.18,.5],0x242f30,[x,.05,-.08]);}
  for(const x of[-.43,.43])addCylinder(tech,.1,.13,.78,0x315d52,[x,1.05,0],[0,0,x<0?-.18:.18]);
  return tech;
}

function buildRaccoon(){
  const group=new THREE.Group();addCylinder(group,.42,.55,1.05,0x4b5657,[0,.48,0],[0,0,Math.PI/2]);const head=addCylinder(group,.36,.42,.55,0x596465,[.62,.66,0],[0,0,Math.PI/2]);head.scale.z=.85;addBox(group,[.42,.15,.45],0x252f31,[.82,.69,0]);addBox(group,[.18,.12,.12],0x182325,[1.02,.61,0]);for(const z of[-.21,.21])addCylinder(group,.09,.15,.32,0x4b5657,[.57,1.05,z],[0,0,z<0?-.4:.4]);addCylinder(group,.17,.28,1.22,0x4b5657,[-.87,.52,0],[0,0,Math.PI/2]);for(let x=-.42;x>-1.34;x-=.26)addBox(group,[.12,.5,.5],0xd0c8b8,[x,.52,0]);group.scale.setScalar(.76);return group;
}

export class Scene3D{
  constructor(canvas){
    this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x10282e);this.scene.fog=new THREE.Fog(0x10282e,13,29);this.camera=new THREE.PerspectiveCamera(58,1,.08,70);this.cameraYaw=Math.PI;this.cameraPitch=.24;this.keys=new Set();this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.handlers={};this.pointerDown=null;this.evidenceMeshes=new Map();this.toolGroups=new Map();this.wallColliders=[];this.lastTime=performance.now();this.onAttic=false;this.ladderGround=new THREE.Vector3(-4.85,0,.65);this.ladderTop=new THREE.Vector3(-4.15,3.65,.2);this.buildWorld();this.bindInput();this.resize();
    this.cameraYaw=0;
  }
  setHandlers(handlers){this.handlers=handlers;}
  setMoveKey(key,pressed){if(pressed)this.keys.add(key);else this.keys.delete(key);}
  nudge(key){const directions={w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]},direction=directions[key];if(!direction)return;const movement=new THREE.Vector3(direction[0],0,direction[1]).applyAxisAngle(UP,this.cameraYaw),candidate=this.technician.position.clone().addScaledVector(movement,.52);candidate.y=this.onAttic?3.65:0;if(!this.collides(candidate))this.technician.position.copy(candidate);this.technician.rotation.y=Math.atan2(movement.x,movement.z)+Math.PI;}
  useLadder(){this.tryLadder();}

  buildWorld(){
    this.roomLabels=new Map();
    this.scene.add(new THREE.HemisphereLight(0xb8d8d7,0x413d31,1.65));
    const moon=new THREE.DirectionalLight(0xd9e8e3,2.4);moon.position.set(-7,13,8);moon.castShadow=true;moon.shadow.mapSize.set(1536,1536);moon.shadow.camera.left=-12;moon.shadow.camera.right=12;moon.shadow.camera.top=12;moon.shadow.camera.bottom=-12;this.scene.add(moon);
    const interior=new THREE.PointLight(0xffa15e,22,17,1.7);interior.position.set(1,2.6,1);this.scene.add(interior);
    const atticLight=new THREE.PointLight(0xf6be70,12,11,1.8);atticLight.position.set(0,5.5,0);this.scene.add(atticLight);
    const ground=mesh(new THREE.CylinderGeometry(11.5,12,.6,48),clay(0x385b4c),[0,-.45,.8]);this.scene.add(ground);
    this.buildHouse();this.technician=buildTechnician();this.technician.position.set(2.45,0,7.25);this.technician.rotation.y=0;this.scene.add(this.technician);this.raccoon=buildRaccoon();this.raccoon.visible=false;this.scene.add(this.raccoon);
  }

  wall(x,z,w,d,height=2.9,y=1.45,color=PALETTE.plaster){
    const item=addBox(this.house,[w,height,d],color,[x,y,z]);this.wallColliders.push({x,z,hw:w/2+.28,hd:d/2+.28});return item;
  }

  floorZone(id,x,z,w,d,color,y=0){
    const floor=addBox(this.house,[w,.22,d],color,[x,y-.12,z]);floor.userData.roomId=id;const label=makeLabel(id==='outside'?'ENTRY':id.toUpperCase());if(id==='outside')label.scale.multiplyScalar(.62);label.userData.roomLabel=id;label.position.set(x,y+2.15,z-d/2+.2);this.scene.add(label);this.roomLabels.set(id,label);return floor;
  }

  buildHouse(){
    this.house=new THREE.Group();this.scene.add(this.house);
    addBox(this.house,[13,.42,11.2],PALETTE.timber,[0,-.38,0]);
    this.floorZone('garage',-3.5,2.55,4.7,4.6,0x6f807a);this.floorZone('kitchen',2.5,2.55,5.1,4.6,0x91a873);this.floorZone('nursery',-3.5,-2.55,4.7,4.5,0xc89298);this.floorZone('hall',2,-2.55,6.2,4.5,0xb6a46f);
    this.floorZone('outside',2.45,6.7,3.1,2.2,0xa97b55);

    // Exterior shell with a real front doorway at x 2.45.
    this.wall(-4.75,5,2.5,.24);this.wall(-1.4,5,4.2,.24);this.wall(4.75,5,2.5,.24);
    this.wall(-6,0,.24,10.2);this.wall(6,0,.24,10.2);this.wall(0,-5,12.2,.24);
    // Interior partitions and door gaps.
    this.wall(-1,3.5,.2,3);this.wall(-1,-.1,.2,.5); // garage / kitchen, wide service doorway
    this.wall(-3.9,.22,4.2,.2);this.wall(-.15,.22,2.1,.2);this.wall(3.7,.22,4.6,.2); // front / rear
    this.wall(-1,-3.65,.2,2.5);this.wall(-1,-.8,.2,1.3); // nursery / hall doorway
    // Door frames make connections obvious.
    for(const [x,z,r] of[[2.45,5,0],[-1,1.3,Math.PI/2],[-1,-.25,Math.PI/2],[-1.15,.22,0]]){
      addBox(this.house,[1.55,.15,.16],PALETTE.timber,[x,2.45,z],[0,r,0]);addBox(this.house,[.15,2.5,.16],PALETTE.timber,[x-.7*Math.cos(r),1.25,z+.7*Math.sin(r)],[0,r,0]);addBox(this.house,[.15,2.5,.16],PALETTE.timber,[x+.7*Math.cos(r),1.25,z-.7*Math.sin(r)],[0,r,0]);
    }
    // Porch and front door.
    addBox(this.house,[3.4,.25,2.6],0xa97b55,[2.45,.02,6.45]);for(let z=5.35;z<7.6;z+=.38)addBox(this.house,[3.05,.04,.08],0x6b503f,[2.45,.17,z]);addBox(this.house,[1.25,2.4,.16],0x70463b,[3.02,1.2,5.58],[0,-1.05,0]);addCylinder(this.house,.06,.06,.09,0xe7b552,[2.72,1.2,5.35],[Math.PI/2,0,0]);

    this.buildGarage();this.buildKitchen();this.buildNursery();this.buildHall();this.buildAttic();
    this.createEvidence('tracks','attic',[1.35,.45,-.6],'TRACKS');this.createEvidence('fur','nursery',[.65,.85,-1.25],'FUR');this.createEvidence('sound','hall',[1.4,.75,.4],'SOUND');this.createEvidence('soffit','outside',[1.1,2.35,-1.15],'ENTRY');
  }

  buildGarage(){
    const g=new THREE.Group();g.position.copy(ROOM_POSITIONS.garage);this.house.add(g);addBox(g,[2.8,.18,.78],0x8a694b,[-.25,.82,-1.45]);for(const x of[-1.35,.85])addBox(g,[.18,1.6,.18],0x5e4939,[x,.05,-1.45]);addBox(g,[1.35,1.55,.55],0xa76c43,[1.15,.65,1]);for(const x of[-1.3,-.75])g.add(mesh(new THREE.TorusGeometry(.43,.16,8,14),clay(0x283234),[x,.43,1],[0,Math.PI/2,0]));
    this.ladder=new THREE.Group();this.ladder.userData.ladder=true;for(let y=.25;y<3.1;y+=.42)addCylinder(this.ladder,.045,.045,1.05,0xd6a64f,[0,y,0],[0,0,Math.PI/2]);for(const x of[-.5,.5])addCylinder(this.ladder,.06,.07,3.25,0xd6a64f,[x,1.55,0]);this.ladder.position.set(-1.35,0,-1.9);g.add(this.ladder);
    this.ladderLabel=makeLabel('E / TAP  CLIMB','#fff4d7','#9a5d32');this.ladderLabel.userData.ladder=true;this.ladderLabel.scale.multiplyScalar(.45);this.ladderLabel.position.set(-4.85,2.8,.8);this.scene.add(this.ladderLabel);
  }
  buildKitchen(){
    const g=new THREE.Group();g.position.copy(ROOM_POSITIONS.kitchen);this.house.add(g);addBox(g,[4.25,.95,.72],0xd6c8aa,[0,.5,-1.55]);for(const x of[-1.6,-.8,0,.8,1.6])addBox(g,[.05,.72,.74],0x7d6854,[x,.5,-1.17]);addBox(g,[1.35,2.2,.85],0xd8d3c5,[1.65,1.1,.95]);addBox(g,[2.1,.22,1.05],0x775a43,[-.55,.78,.8]);for(const x of[-1.25,.15])for(const z of[.4,1.2])addCylinder(g,.06,.07,.78,0x5d4638,[x,.37,z]);
  }
  buildNursery(){
    const g=new THREE.Group();g.position.copy(ROOM_POSITIONS.nursery);this.house.add(g);addBox(g,[1.65,.55,1.05],0xe7d6bf,[-.8,.38,-.65]);for(const x of[-1.53,-.07])for(const z of[-1.08,-.22])addCylinder(g,.045,.05,.68,0x6d5547,[x,.24,z]);addBox(g,[1.15,.75,.65],0x7f6254,[.85,.42,.85]);addCylinder(g,.06,.08,1.45,0x675248,[.65,.75,-.65]);for(let i=0;i<4;i++)addCylinder(g,.08,.1,.18,[0xe87955,0x67a6a2,0xe4b652,0x9b7fb2][i],[.65+Math.cos(i*1.57)*.35,1.35,-.65+Math.sin(i*1.57)*.35]);
  }
  buildHall(){
    const g=new THREE.Group();g.position.copy(ROOM_POSITIONS.hall);this.house.add(g);addBox(g,[3.4,.08,1.05],0x8a4f42,[.2,.04,.3]);addBox(g,[1.1,1.45,.5],0x795b46,[2.15,.72,-1.55]);addBox(g,[.85,.08,.35],0xe3d2b2,[2.15,1.45,-1.27]);
  }
  buildAttic(){
    this.attic=new THREE.Group();this.attic.position.y=3.65;this.scene.add(this.attic);const floor=addBox(this.attic,[11.6,.32,9.3],0x806a50,[0,-.16,0]);floor.userData.roomId='attic';
    addBox(this.attic,[.22,2.5,9.3],PALETTE.plaster,[-5.8,1.1,0]);addBox(this.attic,[.22,2.5,9.3],PALETTE.plaster,[5.8,1.1,0]);addBox(this.attic,[11.6,2.5,.22],PALETTE.plaster,[0,1.1,-4.55]);addBox(this.attic,[11.6,2.5,.22],PALETTE.plaster,[0,1.1,4.55]);
    for(let x=-5;x<5.5;x+=1)addBox(this.attic,[.14,.16,8.6],0x9a7655,[x,.04,0]);addBox(this.attic,[1.2,.85,.9],0x86613f,[-2.5,.54,.4]);addBox(this.attic,[1.7,.55,.65],0x6a4b35,[2.6,.4,-.4],[0,.25,0]);
    // Sloped roof panels create an enclosed attic without blocking the follow camera.
    addBox(this.attic,[6.8,.18,9.7],0x644b3a,[-3.1,3.3,0],[0,0,-.48]);addBox(this.attic,[6.8,.18,9.7],0x644b3a,[3.1,3.3,0],[0,0,.48]);
    const label=makeLabel('ATTIC');label.userData.roomLabel='attic';label.position.set(0,5.45,-4.35);this.scene.add(label);this.roomLabels.set('attic',label);
    // Ladder opening and top rails.
    addBox(this.attic,[1.6,.06,1.3],0x202b2d,[-4.15,.03,.2]);for(const x of[-4.65,-3.65])addCylinder(this.attic,.06,.07,1.8,0xd6a64f,[x,.9,.2]);
  }

  createEvidence(id,roomId,local,labelText){
    const marker=new THREE.Group();marker.userData.evidenceId=id;marker.userData.roomId=roomId;const gem=mesh(new THREE.OctahedronGeometry(.25),clay(PALETTE.amber,{emissive:PALETTE.amber,emissiveIntensity:.75}),[0,0,0]);gem.userData.evidenceId=id;marker.add(gem);const ring=mesh(new THREE.TorusGeometry(.44,.045,8,20),clay(PALETTE.cream,{emissive:PALETTE.amber,emissiveIntensity:.55}),[0,0,0],[Math.PI/2,0,0]);ring.userData.evidenceId=id;marker.add(ring);const label=makeLabel(labelText,'#fff4d7','#9a5d32');label.position.y=.62;label.scale.multiplyScalar(.58);marker.add(label);marker.position.copy(ROOM_POSITIONS[roomId]).add(new THREE.Vector3(...local));this.scene.add(marker);this.evidenceMeshes.set(id,marker);
  }

  bindInput(){
    window.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))this.keys.add(key);if(key==='e'&&!event.repeat)this.tryLadder();});window.addEventListener('keyup',event=>this.keys.delete(event.key.toLowerCase()));
    this.canvas.addEventListener('pointerdown',event=>{this.pointerDown={x:event.clientX,y:event.clientY,yaw:this.cameraYaw,pitch:this.cameraPitch};this.canvas.setPointerCapture(event.pointerId);});this.canvas.addEventListener('pointermove',event=>{if(!this.pointerDown)return;const dx=event.clientX-this.pointerDown.x,dy=event.clientY-this.pointerDown.y;if(Math.hypot(dx,dy)>6){this.cameraYaw=this.pointerDown.yaw-dx*.006;this.cameraPitch=THREE.MathUtils.clamp(this.pointerDown.pitch+dy*.004,.08,.5);}});this.canvas.addEventListener('pointerup',event=>{if(!this.pointerDown)return;const moved=Math.hypot(event.clientX-this.pointerDown.x,event.clientY-this.pointerDown.y);this.pointerDown=null;if(moved<7)this.pick(event);});this.canvas.addEventListener('contextmenu',event=>event.preventDefault());window.addEventListener('resize',()=>this.resize());
  }

  tryLadder(){
    const target=this.onAttic?this.ladderTop:this.ladderGround;if(this.technician.position.distanceTo(target)>1.55){this.handlers.onLadder?.('far');return;}
    this.onAttic=!this.onAttic;this.technician.position.copy(this.onAttic?this.ladderTop:this.ladderGround);this.technician.position.y=this.onAttic?3.65:0;this.handlers.onLadder?.(this.onAttic?'up':'down');
  }

  pick(event){
    const rect=this.canvas.getBoundingClientRect();this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.scene.children,true);const findData=key=>{for(const hit of hits){let item=hit.object;while(item){if(item.userData[key])return item.userData[key];item=item.parent;}}return null;};
    if(findData('ladder')){this.tryLadder();return;}
    const evidenceId=findData('evidenceId');if(evidenceId){const marker=this.evidenceMeshes.get(evidenceId),sameLevel=Math.abs(marker.position.y-this.technician.position.y)<2.2;if(!sameLevel||marker.position.distanceTo(this.technician.position)>2.7){this.handlers.onTooFar?.('evidence');return;}this.handlers.onEvidence?.(evidenceId);return;}
    const roomLabel=findData('roomLabel'),roomId=roomLabel||findData('roomId');if(roomId){const correctLevel=roomId==='attic'?this.onAttic:!this.onAttic,horizontal=new THREE.Vector2(this.technician.position.x,this.technician.position.z).distanceTo(new THREE.Vector2(ROOM_POSITIONS[roomId].x,ROOM_POSITIONS[roomId].z));if(!correctLevel||horizontal>(roomId==='attic'?6:3.7)){this.handlers.onTooFar?.('room');return;}this.handlers.onRoom?.(roomId);}
  }

  resize(){const rect=this.canvas.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  collides(candidate){
    if(this.onAttic)return candidate.x<-5.25||candidate.x>5.25||candidate.z<-4||candidate.z>4;
    const inside=candidate.x>-5.7&&candidate.x<5.7&&candidate.z>-4.7&&candidate.z<4.7,outside=candidate.x>1.25&&candidate.x<3.7&&candidate.z>=4.65&&candidate.z<8.2;if(!inside&&!outside)return true;
    return this.wallColliders.some(w=>Math.abs(candidate.x-w.x)<w.hw&&Math.abs(candidate.z-w.z)<w.hd);
  }
  updateMovement(delta){
    let forward=0,side=0;if(this.keys.has('w')||this.keys.has('arrowup'))forward++;if(this.keys.has('s')||this.keys.has('arrowdown'))forward--;if(this.keys.has('a')||this.keys.has('arrowleft'))side--;if(this.keys.has('d')||this.keys.has('arrowright'))side++;if(!forward&&!side){this.technician.position.y=this.onAttic?3.65:0;return;}
    const movement=new THREE.Vector3(side,0,-forward).normalize().applyAxisAngle(UP,this.cameraYaw),candidate=this.technician.position.clone().addScaledVector(movement,delta*3.25);candidate.y=this.onAttic?3.65:0;if(!this.collides(candidate))this.technician.position.copy(candidate);
    // The model's face points toward -Z, so add PI relative to Three's +Z-facing yaw convention.
    this.technician.rotation.y=Math.atan2(movement.x,movement.z)+Math.PI;this.technician.userData.walk=(this.technician.userData.walk||0)+delta*9;this.technician.position.y=(this.onAttic?3.65:0)+Math.abs(Math.sin(this.technician.userData.walk))*.045;
  }

  syncTools(state){
    const wanted=new Set();state.traps.forEach(roomId=>{const key=`trap:${roomId}`;wanted.add(key);if(!this.toolGroups.has(key)){const group=new THREE.Group();group.userData.roomId=roomId;const cage=addBox(group,[1.15,.75,.75],PALETTE.metal,[0,.42,0]);cage.material.wireframe=true;addBox(group,[.2,.15,.45],PALETTE.orange,[.05,.16,0]);group.position.copy(ROOM_POSITIONS[roomId]).add(new THREE.Vector3(.65,.12,.45));this.scene.add(group);this.toolGroups.set(key,group);}this.toolGroups.get(key).children[0].material.color.set(state.animal.captured?PALETTE.green:PALETTE.metal);});
    state.barriers.forEach(roomId=>{const key=`barrier:${roomId}`;wanted.add(key);if(!this.toolGroups.has(key)){const group=new THREE.Group();group.userData.roomId=roomId;for(let i=-2;i<=2;i++)addBox(group,[1.7,.13,.1],i%2?PALETTE.cream:PALETTE.orange,[0,.42+i*.22,0],[0,0,i*.16]);group.position.copy(ROOM_POSITIONS[roomId]).add(new THREE.Vector3(-.5,.08,.1));this.scene.add(group);this.toolGroups.set(key,group);}});
    if(state.closeout.seal)wanted.add('patch:outside');if(state.closeout.seal&&!this.toolGroups.has('patch:outside')){const group=new THREE.Group();addBox(group,[1.05,.08,.58],PALETTE.green,[0,0,0]);group.position.copy(ROOM_POSITIONS.outside).add(new THREE.Vector3(1.1,2.35,-1.3));group.rotation.x=Math.PI/2;this.scene.add(group);this.toolGroups.set('patch:outside',group);}for(const[key,group]of this.toolGroups)if(!wanted.has(key)){this.scene.remove(group);this.toolGroups.delete(key);}
  }
  updateRoute(state){if(this.routeLine){this.scene.remove(this.routeLine);this.routeLine.geometry.dispose();this.routeLine.material.dispose();this.routeLine=null;}if(state.phase!=='contain'||!state.animal.moving)return;const start=ROOM_POSITIONS[state.animal.from].clone().add(new THREE.Vector3(0,.65,0)),end=ROOM_POSITIONS[state.animal.to].clone().add(new THREE.Vector3(0,.65,0)),middle=start.clone().lerp(end,.5);middle.y+=.65;const curve=new THREE.QuadraticBezierCurve3(start,middle,end),geometry=new THREE.TubeGeometry(curve,18,.065,6,false),material=clay(PALETTE.orange,{emissive:PALETTE.orange,emissiveIntensity:1.1});this.routeLine=new THREE.Mesh(geometry,material);this.scene.add(this.routeLine);}
  sync(state,now){
    for(const[id,label]of this.roomLabels)label.visible=id==='attic'?this.onAttic:!this.onAttic;
    for(const[id,marker]of this.evidenceMeshes){marker.visible=['investigate','diagnose'].includes(state.phase);const found=state.found.includes(id);marker.children[0].material.color.set(found?PALETTE.green:PALETTE.amber);marker.children[0].material.emissive.set(found?PALETTE.green:PALETTE.amber);marker.rotation.y=now*.0012;marker.scale.setScalar(found?.76:1+Math.sin(now*.004+id.length)*.08);}
    this.syncTools(state);this.raccoon.visible=['contain','closeout','resolved'].includes(state.phase)&&!state.animal.escaped;if(this.raccoon.visible){const from=ROOM_POSITIONS[state.animal.from],to=ROOM_POSITIONS[state.animal.to];let t=state.animal.moving?Math.min(1,(now-state.animal.moveStart)/state.animal.moveDuration):1;t=t*t*(3-2*t);const position=state.animal.moving?from.clone().lerp(to,t):ROOM_POSITIONS[state.animal.room].clone();this.raccoon.position.copy(position);this.raccoon.position.y+=.22+Math.abs(Math.sin(now*.014))*(state.animal.moving?.1:.02);if(state.animal.moving)this.raccoon.rotation.y=Math.atan2(to.x-from.x,to.z-from.z)+Math.PI/2;this.raccoon.scale.setScalar(state.animal.captured?.58:.76);}const routeKey=state.animal.moving?`${state.animal.from}:${state.animal.to}:${state.animal.moveStart}`:'';if(routeKey!==this.routeKey){this.routeKey=routeKey;this.updateRoute(state);}
    for(const marker of this.evidenceMeshes.values())marker.visible=marker.visible&&((marker.position.y>2.5)===this.onAttic);
    const ladderTarget=this.onAttic?this.ladderTop:this.ladderGround;this.ladderLabel.visible=this.technician.position.distanceTo(ladderTarget)<2.2;this.ladderLabel.position.y=this.onAttic?5.5:2.8;
  }
  render(now,state){const delta=Math.min(.04,Math.max(0,(now-this.lastTime)/1000));this.lastTime=now;this.updateMovement(delta);this.sync(state,now);const target=this.technician.position.clone().add(new THREE.Vector3(0,1.25,0)),inside=this.onAttic||(this.technician.position.z<4.8),distance=inside?2.65:3.7,offset=new THREE.Vector3(Math.sin(this.cameraYaw)*Math.cos(this.cameraPitch),Math.sin(this.cameraPitch),Math.cos(this.cameraYaw)*Math.cos(this.cameraPitch)).multiplyScalar(distance),desired=target.clone().add(offset);this.camera.position.lerp(desired,1-Math.pow(.0015,delta));this.camera.lookAt(target.clone().add(new THREE.Vector3(0,.08,-1.15).applyAxisAngle(UP,this.cameraYaw)));this.renderer.render(this.scene,this.camera);}
}
