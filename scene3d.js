import * as THREE from 'three';

const ROOM_POSITIONS = {
  attic: new THREE.Vector3(0, 3.15, -5.2),
  nursery: new THREE.Vector3(-3.7, .35, -2),
  hall: new THREE.Vector3(.5, .35, -2),
  garage: new THREE.Vector3(-4.1, .35, 2.7),
  kitchen: new THREE.Vector3(.5, .35, 2.7),
  outside: new THREE.Vector3(5.2, .25, 2.9)
};

const ROOM_SIZES = {
  attic: [7.8, 2.6], nursery: [3.8, 3.5], hall: [3.8, 3.5],
  garage: [4.2, 4.2], kitchen: [4.2, 4.2], outside: [3.4, 4.2]
};

const PALETTE = {
  ink: 0x142e31, cream: 0xeadfca, plaster: 0xd8cbb0, timber: 0x795b47,
  orange: 0xe87e45, amber: 0xf4b35d, teal: 0x4ea9a0, green: 0x4f8b68,
  red: 0xc85443, garage: 0x71847c, nursery: 0xc9989d, hall: 0xbba86f,
  kitchen: 0x91aa72, lawn: 0x4f725f, metal: 0x59686a, dark: 0x27383a
};

function clay(color, options = {}) {
  const settings = {
    color, roughness: options.roughness ?? .92, metalness: options.metalness ?? 0,
    flatShading: options.flatShading ?? true, emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  };
  if (options.transparent !== undefined) settings.transparent = options.transparent;
  if (options.opacity !== undefined) settings.opacity = options.opacity;
  return new THREE.MeshStandardMaterial(settings);
}

function mesh(geometry, material, position, rotation) {
  const item = new THREE.Mesh(geometry, material);
  if (position) item.position.set(...position);
  if (rotation) item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function makeLabel(text, color = '#f4eddd', background = '#142e31') {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background; ctx.roundRect(10, 10, 492, 108, 24); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.stroke();
  ctx.fillStyle = color; ctx.font = '900 42px system-ui'; ctx.textAlign = 'center';
  ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 65);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(2.35, .59, 1);
  return sprite;
}

function addBox(group, size, color, position, rotation, options) {
  const item = mesh(new THREE.BoxGeometry(...size, 2, 2, 2), clay(color, options), position, rotation);
  group.add(item); return item;
}

function addCylinder(group, radiusTop, radiusBottom, height, color, position, rotation) {
  const item = mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 10), clay(color), position, rotation);
  group.add(item); return item;
}

function buildTechnician() {
  const tech = new THREE.Group();
  tech.name = 'technician';
  addCylinder(tech, .34, .42, .92, 0x315d52, [0, 1.02, 0]);
  addBox(tech, [.58, .7, .26], 0xd7803e, [0, 1.05, .3], [-.05, 0, 0]);
  addCylinder(tech, .27, .29, .42, 0xbc8063, [0, 1.72, 0]);
  addCylinder(tech, .33, .29, .16, 0xe5a646, [0, 1.95, 0]);
  addBox(tech, [.32, .08, .42], 0xe5a646, [0, 1.91, -.18], [.08, 0, 0]);
  for (const x of [-.19, .19]) {
    addCylinder(tech, .11, .13, .75, 0x2d4645, [x, .34, 0]);
    addBox(tech, [.3, .18, .5], 0x242f30, [x, .05, -.08]);
  }
  for (const x of [-.43, .43]) addCylinder(tech, .1, .13, .78, 0x315d52, [x, 1.05, 0], [0, 0, x < 0 ? -.18 : .18]);
  tech.rotation.y = Math.PI;
  return tech;
}

function buildRaccoon() {
  const raccoon = new THREE.Group();
  addCylinder(raccoon, .42, .55, 1.05, 0x4b5657, [0, .48, 0], [0, 0, Math.PI / 2]);
  const head = addCylinder(raccoon, .36, .42, .55, 0x596465, [.62, .66, 0], [0, 0, Math.PI / 2]);
  head.scale.z = .85;
  addBox(raccoon, [.42, .15, .45], 0x252f31, [.82, .69, 0]);
  addBox(raccoon, [.18, .12, .12], 0x182325, [1.02, .61, 0]);
  for (const z of [-.21, .21]) addCylinder(raccoon, .09, .15, .32, 0x4b5657, [.57, 1.05, z], [0, 0, z < 0 ? -.4 : .4]);
  const tail = addCylinder(raccoon, .17, .28, 1.22, 0x4b5657, [-.87, .52, 0], [0, 0, Math.PI / 2]);
  for (let x = -.42; x > -1.34; x -= .26) addBox(raccoon, [.12, .5, .5], 0xd0c8b8, [x, .52, 0]);
  raccoon.scale.setScalar(.76);
  return raccoon;
}

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x10282e);
    this.scene.fog = new THREE.Fog(0x10282e, 15, 34);
    this.camera = new THREE.PerspectiveCamera(52, 1, .1, 80);
    this.cameraYaw = .08;
    this.cameraPitch = .36;
    this.keys = new Set();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.handlers = {};
    this.pointerDown = null;
    this.roomGroups = new Map();
    this.evidenceMeshes = new Map();
    this.toolGroups = new Map();
    this.routeLine = null;
    this.lastTime = performance.now();
    this.buildWorld();
    this.bindInput();
    this.resize();
  }

  setHandlers(handlers) { this.handlers = handlers; }

  buildWorld() {
    const hemi = new THREE.HemisphereLight(0xb6dce0, 0x4b4938, 2.25);
    this.scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xdbe7df, 2.9);
    moon.position.set(-8, 14, 7); moon.castShadow = true;
    moon.shadow.mapSize.set(1536, 1536); moon.shadow.camera.left = -13; moon.shadow.camera.right = 13;
    moon.shadow.camera.top = 12; moon.shadow.camera.bottom = -12;
    this.scene.add(moon);
    const warm = new THREE.PointLight(0xffa35c, 28, 15, 1.5);
    warm.position.set(-.3, 5.4, 0); this.scene.add(warm);

    const ground = mesh(new THREE.CylinderGeometry(12, 12.8, .65, 48), clay(0x385b4c), [0, -.42, .4]);
    this.scene.add(ground);
    for (let i = 0; i < 42; i++) {
      const angle = i * 2.399, radius = 8.5 + (i % 6) * .48;
      addCylinder(this.scene, .12, .2, .45 + (i % 3) * .12, i % 2 ? 0x547761 : 0x426852,
        [Math.cos(angle) * radius, -.02, Math.sin(angle) * radius]);
    }
    this.buildHouse();
    this.technician = buildTechnician();
    this.technician.position.set(2.6, 0, 5.3); this.scene.add(this.technician);
    this.raccoon = buildRaccoon(); this.raccoon.visible = false; this.scene.add(this.raccoon);
    this.camera.position.set(2.8, 4.2, 9.2);
  }

  buildHouse() {
    const colors = { attic: 0x806a50, nursery: PALETTE.nursery, hall: PALETTE.hall, garage: PALETTE.garage, kitchen: PALETTE.kitchen, outside: PALETTE.lawn };
    Object.entries(ROOM_POSITIONS).forEach(([id, pos]) => {
      const group = new THREE.Group(); group.name = id; group.userData.roomId = id;
      const [w, d] = ROOM_SIZES[id];
      const floor = addBox(group, [w, .32, d], colors[id], [0, -.18, 0]); floor.userData.roomId = id;
      const border = addBox(group, [w + .16, .12, d + .16], PALETTE.ink, [0, -.38, 0]); border.userData.roomId = id;
      if (id !== 'outside') {
        addBox(group, [.22, 2.15, d], PALETTE.plaster, [-w / 2, .9, 0]);
        addBox(group, [w, 2.15, .22], PALETTE.plaster, [0, .9, -d / 2]);
      }
      group.position.copy(pos); this.scene.add(group); this.roomGroups.set(id, group);
      const label = makeLabel(id === 'outside' ? 'YARD / ENTRY' : id.toUpperCase());
      label.userData.roomLabel = id;
      label.position.set(pos.x, pos.y + (id === 'attic' ? 1.3 : 2.15), pos.z - ROOM_SIZES[id][1] / 2 + .1);
      this.scene.add(label);
    });

    const attic = this.roomGroups.get('attic');
    addBox(attic, [8.5, .28, 3.1], PALETTE.timber, [0, -.58, 0]);
    for (let x = -3.4; x < 4; x += .85) addBox(attic, [.16, .18, 2.5], 0x9a7655, [x, .04, 0]);
    addBox(attic, [4.3, .14, 2.7], 0xb7a77d, [.8, .16, 0], [0, 0, -.04]);
    addBox(attic, [1.1, .8, .9], 0x86613f, [-2.5, .54, .4]);
    addBox(attic, [1.6, .55, .65], 0x6a4b35, [2.5, .4, -.4], [0, .25, 0]);

    const nursery = this.roomGroups.get('nursery');
    addBox(nursery, [1.65, .55, 1.05], 0xe7d6bf, [-.75, .38, -.6]);
    for (const x of [-1.48, -.02]) for (const z of [-1.03, -.17]) addCylinder(nursery, .045, .05, .68, 0x6d5547, [x, .24, z]);
    addBox(nursery, [1.15, .75, .65], 0x7f6254, [.85, .42, .85]);
    addCylinder(nursery, .06, .08, 1.45, 0x675248, [.6, .75, -.65]);
    for (let i = 0; i < 4; i++) addCylinder(nursery, .08, .1, .18, [0xe87955,0x67a6a2,0xe4b652,0x9b7fb2][i], [.6 + Math.cos(i*1.57)*.35, 1.35, -.65 + Math.sin(i*1.57)*.35]);

    const hall = this.roomGroups.get('hall');
    addBox(hall, [2.8, .08, 1.05], 0x8a4f42, [0, .04, .25]);
    for (let x = -1.5; x < 1.7; x += .4) addCylinder(hall, .035, .045, .9, 0x5a473b, [x, .5, -1.35]);
    addBox(hall, [3.35, .1, .12], 0x5a473b, [0, .98, -1.35]);

    const garage = this.roomGroups.get('garage');
    addBox(garage, [2.8, .18, .78], 0x8a694b, [-.35, .82, -1.45]);
    for (const x of [-1.45, .75]) addBox(garage, [.18, 1.6, .18], 0x5e4939, [x, .05, -1.45]);
    addBox(garage, [1.55, 1.6, .55], 0xa76c43, [1.25, .65, .95]);
    for (const x of [-1.45, -.9]) {
      const tire = mesh(new THREE.TorusGeometry(.43, .16, 8, 14), clay(0x283234), [x, .43, .95], [0, Math.PI / 2, 0]); garage.add(tire);
    }
    for (let i=0;i<12;i++) addCylinder(garage,.025,.025,.04,0x415456,[-1.35+(i%6)*.36,1.2+Math.floor(i/6)*.32,-1.04],[Math.PI/2,0,0]);

    const kitchen = this.roomGroups.get('kitchen');
    addBox(kitchen, [3.35, .95, .72], 0xd7c9ac, [-.15, .5, -1.45]);
    for (const x of [-1.4,-.7,0,.7,1.4]) addBox(kitchen, [.05, .72, .74], 0x7d6854, [x, .5, -1.07]);
    addBox(kitchen, [1.4, 2.2, .85], 0xd8d3c5, [1.35, 1.1, .95]);
    addBox(kitchen, [2.15, .22, 1.05], 0x775a43, [-.55, .78, .85]);
    for (const x of [-1.3,.2]) for (const z of [.45,1.25]) addCylinder(kitchen,.06,.07,.78,0x5d4638,[x,.37,z]);

    const outside = this.roomGroups.get('outside');
    addBox(outside, [2.8, .2, 2.6], 0xa87955, [-.2, .02, 0]);
    for (let z=-1;z<1.1;z+=.45) addBox(outside,[2.55,.05,.06],0x6a4e3c,[-.2,.14,z]);
    addBox(outside, [2.55, 2.8, .25], 0xd7c9ae, [-.2, 1.4, -1.7]);
    addBox(outside, [1.05, 2.25, .2], 0x764a3c, [-.2, 1.12, -1.5]);
    addBox(outside, [.65, .5, .45], 0x3c5f51, [1.15, .28, 1.25]);
    this.soffitDamage = addBox(outside, [.85, .18, .38], PALETTE.red, [.75, 2.56, -1.45], [0, 0, -.22]);

    this.createEvidence('tracks', 'attic', [1.2, .65, .1], 'TRACKS');
    this.createEvidence('fur', 'nursery', [.55, 1.25, -1.3], 'FUR');
    this.createEvidence('sound', 'hall', [.9, 1.1, -.4], 'SOUND');
    this.createEvidence('soffit', 'outside', [.75, 2.85, -1.45], 'ENTRY');
  }

  createEvidence(id, roomId, localPosition, labelText) {
    const marker = new THREE.Group(); marker.userData.evidenceId = id; marker.userData.roomId = roomId;
    const gem = mesh(new THREE.OctahedronGeometry(.28, 0), clay(PALETTE.amber, { emissive: PALETTE.amber, emissiveIntensity: .7 }), [0, 0, 0]);
    gem.userData.evidenceId = id; marker.add(gem);
    const ring = mesh(new THREE.TorusGeometry(.47, .045, 8, 20), clay(PALETTE.cream, { emissive: PALETTE.amber, emissiveIntensity: .55 }), [0, 0, 0], [Math.PI / 2, 0, 0]);
    ring.userData.evidenceId = id; marker.add(ring);
    const label = makeLabel(labelText, '#fff4d7', '#9a5d32'); label.position.y = .65; label.scale.multiplyScalar(.62); marker.add(label);
    const room = this.roomGroups.get(roomId); marker.position.copy(room.position).add(new THREE.Vector3(...localPosition));
    this.scene.add(marker); this.evidenceMeshes.set(id, marker);
  }

  bindInput() {
    window.addEventListener('keydown', event => { if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(event.key.toLowerCase())) this.keys.add(event.key.toLowerCase()); });
    window.addEventListener('keyup', event => this.keys.delete(event.key.toLowerCase()));
    this.canvas.addEventListener('pointerdown', event => { this.pointerDown = { x: event.clientX, y: event.clientY, yaw: this.cameraYaw, pitch: this.cameraPitch }; this.canvas.setPointerCapture(event.pointerId); });
    this.canvas.addEventListener('pointermove', event => {
      if (!this.pointerDown) return;
      const dx = event.clientX - this.pointerDown.x, dy = event.clientY - this.pointerDown.y;
      if (Math.hypot(dx, dy) > 6) {
        this.cameraYaw = this.pointerDown.yaw - dx * .006;
        this.cameraPitch = THREE.MathUtils.clamp(this.pointerDown.pitch + dy * .004, .16, .72);
      }
    });
    this.canvas.addEventListener('pointerup', event => {
      if (!this.pointerDown) return;
      const moved = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      this.pointerDown = null;
      if (moved < 7) this.pick(event);
    });
    this.canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('resize', () => this.resize());
  }

  pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    const findData = key => {
      for (const hit of hits) {
        let item = hit.object;
        while (item) { if (item.userData[key]) return item.userData[key]; item = item.parent; }
      }
      return null;
    };
    const evidenceId = findData('evidenceId');
    if (evidenceId) { this.handlers.onEvidence?.(evidenceId); return; }
    const roomLabel = findData('roomLabel');
    if (roomLabel) { this.handlers.onRoom?.(roomLabel); return; }
    const roomId = findData('roomId');
    if (roomId) this.handlers.onRoom?.(roomId);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }

  updateMovement(delta) {
    let forward = 0, side = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) forward += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) forward -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) side -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) side += 1;
    if (!forward && !side) return;
    const movement = new THREE.Vector3(side, 0, -forward).normalize().applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraYaw);
    this.technician.position.addScaledVector(movement, delta * 4.2);
    this.technician.position.x = THREE.MathUtils.clamp(this.technician.position.x, -7.2, 7.3);
    this.technician.position.z = THREE.MathUtils.clamp(this.technician.position.z, -6.2, 6.7);
    this.technician.rotation.y = Math.atan2(movement.x, movement.z);
    this.technician.userData.walk = (this.technician.userData.walk || 0) + delta * 9;
    this.technician.position.y = Math.abs(Math.sin(this.technician.userData.walk)) * .055;
  }

  syncTools(state) {
    const wanted = new Set();
    state.traps.forEach(roomId => {
      const key = `trap:${roomId}`; wanted.add(key);
      if (!this.toolGroups.has(key)) {
        const group = new THREE.Group(); group.userData.roomId = roomId;
        const cage = addBox(group, [1.15, .75, .75], PALETTE.metal, [0, .42, 0]); cage.material.wireframe = true;
        addBox(group, [.2, .15, .45], PALETTE.orange, [.05, .16, 0]);
        group.position.copy(ROOM_POSITIONS[roomId]).add(new THREE.Vector3(.75, .15, .55)); this.scene.add(group); this.toolGroups.set(key, group);
      }
      const group = this.toolGroups.get(key); group.children[0].material.color.set(state.animal.captured ? PALETTE.green : PALETTE.metal);
    });
    state.barriers.forEach(roomId => {
      const key = `barrier:${roomId}`; wanted.add(key);
      if (!this.toolGroups.has(key)) {
        const group = new THREE.Group(); group.userData.roomId = roomId;
        for (let i = -2; i <= 2; i++) addBox(group, [1.8, .13, .1], i % 2 ? PALETTE.cream : PALETTE.orange, [0, .3 + i * .22, 0], [0, 0, i * .16]);
        group.position.copy(ROOM_POSITIONS[roomId]).add(new THREE.Vector3(-.65, .12, .25)); this.scene.add(group); this.toolGroups.set(key, group);
      }
    });
    if (state.closeout.seal) wanted.add('patch:outside');
    if (state.closeout.seal && !this.toolGroups.has('patch:outside')) {
      const group = new THREE.Group(); addBox(group, [1.05,.08,.58], PALETTE.green, [0,0,0]);
      group.position.copy(ROOM_POSITIONS.outside).add(new THREE.Vector3(.75,2.55,-1.65)); group.rotation.x = Math.PI/2; this.scene.add(group); this.toolGroups.set('patch:outside', group);
    }
    for (const [key, group] of this.toolGroups) if (!wanted.has(key)) { this.scene.remove(group); this.toolGroups.delete(key); }
  }

  updateRoute(state) {
    if (this.routeLine) { this.scene.remove(this.routeLine); this.routeLine.geometry.dispose(); this.routeLine.material.dispose(); this.routeLine = null; }
    if (state.phase !== 'contain' || !state.animal.moving) return;
    const start = ROOM_POSITIONS[state.animal.from].clone().add(new THREE.Vector3(0, .65, 0));
    const end = ROOM_POSITIONS[state.animal.to].clone().add(new THREE.Vector3(0, .65, 0));
    const middle = start.clone().lerp(end, .5); middle.y += .55;
    const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
    const geometry = new THREE.TubeGeometry(curve, 18, .07, 6, false);
    const material = clay(PALETTE.orange, { emissive: PALETTE.orange, emissiveIntensity: 1.1 });
    this.routeLine = new THREE.Mesh(geometry, material); this.scene.add(this.routeLine);
    const cone = mesh(new THREE.ConeGeometry(.22,.55,8), material, end.toArray()); cone.rotation.x = Math.PI/2; this.routeLine.add(cone);
  }

  sync(state, now) {
    for (const [id, marker] of this.evidenceMeshes) {
      marker.visible = ['investigate','diagnose'].includes(state.phase);
      const found = state.found.includes(id);
      marker.children[0].material.color.set(found ? PALETTE.green : PALETTE.amber);
      marker.children[0].material.emissive.set(found ? PALETTE.green : PALETTE.amber);
      marker.rotation.y = now * .0012;
      marker.scale.setScalar(found ? .78 : 1 + Math.sin(now * .004 + id.length) * .08);
    }
    this.syncTools(state);
    this.soffitDamage.visible = !state.closeout.seal;
    this.raccoon.visible = ['contain','closeout','resolved'].includes(state.phase) && !state.animal.escaped;
    if (this.raccoon.visible) {
      const from = ROOM_POSITIONS[state.animal.from], to = ROOM_POSITIONS[state.animal.to];
      let t = state.animal.moving ? Math.min(1, (now - state.animal.moveStart) / state.animal.moveDuration) : 1;
      t = t * t * (3 - 2 * t);
      const position = state.animal.moving ? from.clone().lerp(to, t) : ROOM_POSITIONS[state.animal.room].clone();
      this.raccoon.position.copy(position); this.raccoon.position.y += .24 + Math.abs(Math.sin(now * .014)) * (state.animal.moving ? .12 : .025);
      if (state.animal.moving) this.raccoon.rotation.y = Math.atan2(to.x-from.x, to.z-from.z) + Math.PI/2;
      this.raccoon.scale.setScalar(state.animal.captured ? .58 : .76);
    }
    const nursery = this.roomGroups.get('nursery');
    nursery.rotation.z = state.incidents.nursery ? -.012 : 0;
    const kitchen = this.roomGroups.get('kitchen');
    kitchen.children.slice(-4).forEach((child, i) => { if (state.incidents.kitchen) child.rotation.z = (i - 1.5) * .22; });
    const routeKey = state.animal.moving ? `${state.animal.from}:${state.animal.to}:${state.animal.moveStart}` : '';
    if (routeKey !== this.routeKey) { this.routeKey = routeKey; this.updateRoute(state); }
  }

  render(now, state) {
    const delta = Math.min(.04, Math.max(0, (now - this.lastTime) / 1000)); this.lastTime = now;
    this.updateMovement(delta); this.sync(state, now);
    const target = this.technician.position.clone().add(new THREE.Vector3(0, 1.25, 0));
    const distance = 6.4;
    const offset = new THREE.Vector3(Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch), Math.sin(this.cameraPitch), Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)).multiplyScalar(distance);
    const desired = target.clone().add(offset);
    this.camera.position.lerp(desired, 1 - Math.pow(.0015, delta));
    this.camera.lookAt(target.clone().add(new THREE.Vector3(0, .15, -1.25).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraYaw)));
    this.renderer.render(this.scene, this.camera);
  }
}
