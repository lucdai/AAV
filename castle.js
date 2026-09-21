import * as THREE from 'https://esm.sh/three@0.160.0';

const canvas = document.querySelector('#sceneCanvas');
const wrap = document.querySelector('#sceneWrap');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#aeb8ad', 70, 145);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 240);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const controls = { target:new THREE.Vector3(0,2,0), autoRotate:false, autoRotateSpeed:.7, update(){} };
let isDragging=false, lastPointer={x:0,y:0};
canvas.addEventListener('pointerdown',e=>{isDragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointerup',()=>{isDragging=false});
canvas.addEventListener('pointermove',e=>{if(!isDragging)return;const dx=(e.clientX-lastPointer.x)*.012,dy=(e.clientY-lastPointer.y)*.012;lastPointer={x:e.clientX,y:e.clientY};const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);spherical.theta-=dx;spherical.phi=Math.max(.18,Math.min(1.48,spherical.phi+dy));offset.setFromSpherical(spherical);camera.position.copy(controls.target).add(offset);camera.lookAt(controls.target)});
canvas.addEventListener('wheel',e=>{e.preventDefault();const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(e.deltaY>0?1.08:.92);const d=offset.length();if(d>25&&d<130){camera.position.copy(controls.target).add(offset);camera.lookAt(controls.target)}},{passive:false});

const mats = {
  stone: new THREE.MeshStandardMaterial({color:'#778078', roughness:.88, metalness:0}),
  darkStone: new THREE.MeshStandardMaterial({color:'#4e5852', roughness:.95}),
  moss: new THREE.MeshStandardMaterial({color:'#718669', roughness:1}),
  brick: new THREE.MeshStandardMaterial({color:'#a7624c', roughness:.9}),
  brickLight: new THREE.MeshStandardMaterial({color:'#bd7658', roughness:.86}),
  sand: new THREE.MeshStandardMaterial({color:'#cdb47a', roughness:1}),
  wood: new THREE.MeshStandardMaterial({color:'#78634b', roughness:1}),
  grass: new THREE.MeshStandardMaterial({color:'#82966b', roughness:1}),
  water: new THREE.MeshStandardMaterial({color:'#6a9dab', roughness:.26, metalness:.05, transparent:true, opacity:.84}),
  gold: new THREE.MeshStandardMaterial({color:'#c5a85c', roughness:.5}),
};
const group = new THREE.Group(); scene.add(group);
const blocks = []; const cube = new THREE.BoxGeometry(1,1,1);
let currentZone='all', maxLayer=12, autoRotate=false, gridVisible=true;
function addBlock(x,y,z,material,zone='yard',scale=[1,1,1]){ const m=new THREE.Mesh(cube,material); m.position.set(x,y+.5,z); m.scale.set(...scale); m.castShadow=true; m.receiveShadow=true; m.userData={y,zone}; group.add(m); blocks.push(m); return m; }
function lineX(x1,x2,y,z,material,zone='wall',height=1){for(let x=x1;x<=x2;x++)for(let yy=0;yy<height;yy++)addBlock(x,y+yy,z,material,zone)}
function lineZ(x,z1,z2,y,material,zone='wall',height=1){for(let z=z1;z<=z2;z++)for(let yy=0;yy<height;yy++)addBlock(x,y+yy,z,material,zone)}
function slab(x1,x2,z1,z2,y,material,zone='yard'){for(let x=x1;x<=x2;x++)for(let z=z1;z<=z2;z++)addBlock(x,y,z,material,zone)}
function room(x1,x2,z1,z2,y,h,material,zone='support',openings=[]){lineX(x1,x2,y,z1,material,zone,h);lineX(x1,x2,y,z2,material,zone,h);lineZ(x1,z1+1,z2-1,y,material,zone,h);lineZ(x2,z1+1,z2-1,y,material,zone,h);for(const o of openings){if(o.side==='south')for(let x=o.start;x<=o.end;x++)for(let yy=0;yy<o.height;yy++)addBlock(x,y+yy,z1,material,zone)} }
function buildCastle(){
  slab(-31,30,-25,24,0,mats.grass,'yard');
  // foundation apron
  slab(-29,28,-23,22,1,mats.darkStone,'yard');
  // walls, 3 blocks thick and 7 blocks high
  for(let y=1;y<=7;y++){lineX(-29,28,y,-23,mats.stone,'wall');lineX(-29,28,y,-21,mats.darkStone,'wall');lineZ(-29,-22,21,y,mats.stone,'wall');lineZ(-27,-22,21,y,mats.darkStone,'wall');lineZ(28,-22,21,y,mats.stone,'wall');lineZ(26,-22,21,y,mats.darkStone,'wall');}
  // crenellations
  for(let x=-29;x<=28;x+=2){addBlock(x,8,-23,mats.darkStone,'wall');addBlock(x,8,21,mats.darkStone,'wall')}
  for(let z=-21;z<=21;z+=2){addBlock(-29,8,z,mats.darkStone,'wall');addBlock(28,8,z,mats.darkStone,'wall')}
  // corners: 9x9 footprints
  const towers=[[-25,-19], [24,-19], [-25,17], [24,17]];
  for(const [cx,cz] of towers){ for(let y=1;y<=11;y++){for(let x=cx-4;x<=cx+4;x++)for(let z=cz-4;z<=cz+4;z++){if(x===cx-4||x===cx+4||z===cz-4||z===cz+4||y===1)addBlock(x,y,z,y>8?mats.darkStone:mats.stone,'wall')}} for(let x=cx-4;x<=cx+4;x+=2)for(let z=cz-4;z<=cz+4;z+=2)addBlock(x,12,z,mats.darkStone,'wall'); }
  // gatehouse and gate opening
  room(-8,8,-23,-16,1,8,mats.stone,'wall',[{side:'south',start:-2,end:2,height:6}]);
  for(let x=-2;x<=2;x++)for(let y=1;y<=6;y++)addBlock(x,y,-23,mats.wood,'wall');
  for(let x=-2;x<=2;x++)for(let z=-15;z<=-10;z++)addBlock(x,1,z,mats.sand,'yard');
  // central walkways
  slab(-2,2,-15,9,1,mats.sand,'yard'); slab(-20,20,-2,2,1,mats.sand,'yard'); slab(-8,8,-15,-3,1,mats.sand,'yard');
  // palace 31 x 21, 2 levels, open-front entrance
  room(-15,15,3,23,1,5,mats.brick,'palace',[{side:'south',start:-3,end:3,height:4}]);
  room(-15,15,3,23,6,5,mats.brickLight,'palace',[{side:'south',start:-3,end:3,height:4}]);
  // palace roof and central tower line
  slab(-15,15,3,23,11,mats.darkStone,'palace');
  for(let x=-15;x<=15;x+=2){addBlock(x,12,3,mats.brick,'palace');addBlock(x,12,23,mats.brick,'palace')}
  // interior floors visible through section layer
  slab(-14,14,4,22,6,mats.wood,'palace');
  // palace interior partitions and grand hall
  lineZ(-5,4,22,1,mats.brick,'palace',5); lineZ(5,4,22,1,mats.brick,'palace',5);
  lineX(-14,-6,1,13,mats.brick,'palace',4); lineX(6,14,1,13,mats.brick,'palace',4);
  // support buildings
  room(-23,-10,-3,6,1,5,mats.moss,'support',[{side:'south',start:-20,end:-17,height:3}]);
  room(10,23,-3,6,1,5,mats.moss,'support',[{side:'south',start:15,end:18,height:3}]);
  // roof trims
  lineX(-23,-10,6,-3,mats.darkStone,'support'); lineX(10,23,6,-3,mats.darkStone,'support');
  // central courtyard fountain
  slab(-2,2,-6,-2,1,mats.darkStone,'yard');slab(-1,1,-5,-3,2,mats.water,'yard');
  // path lights / banners
  for(const [x,z] of [[-5,-11],[5,-11],[-5,10],[5,10],[-18,-9],[18,-9]]){addBlock(x,1,z,mats.wood,'yard');addBlock(x,2,z,mats.gold,'yard');}
}
buildCastle();

const ground = new THREE.Mesh(new THREE.PlaneGeometry(180,180), new THREE.MeshStandardMaterial({color:'#9da89c',roughness:1})); ground.rotation.x=-Math.PI/2; ground.position.y=-.02; ground.receiveShadow=true; scene.add(ground);
const grid = new THREE.GridHelper(130,65,'#d8ded4','#b6c1b6'); grid.position.y=.01; grid.material.opacity=.22; grid.material.transparent=true; scene.add(grid);
const hemi=new THREE.HemisphereLight('#f2f5e7','#657064',2.2); scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff3cf',4.0); sun.position.set(-35,55,28); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65; scene.add(sun);
const fill=new THREE.DirectionalLight('#b7d8ff',1.2);fill.position.set(40,25,-25);scene.add(fill);
function resize(){const r=wrap.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()} window.addEventListener('resize',resize);resize();
function setCamera(name){const presets={hero:[47,42,52],top:[0,82,.1],court:[35,27,-42],section:[-45,31,32]};const p=presets[name]||presets.hero;camera.position.set(...p);controls.target.set(0,2,0);camera.lookAt(controls.target);document.querySelector('#cameraLabel').textContent=(name||'hero').toUpperCase()+' / '+Math.round(camera.position.y)+'°';}
setCamera('hero');
function updateBlocks(){let visible=0;for(const b of blocks){const inLayer=b.userData.y<=maxLayer;const inZone=currentZone==='all'||b.userData.zone===currentZone;b.visible=inLayer&&inZone;if(b.visible)visible++}document.querySelector('#blockCount').textContent=visible.toLocaleString('vi-VN')+' blocks';const label=maxLayer===12?'0—12':'0—'+maxLayer;document.querySelector('#layerValue').textContent=label;document.querySelector('#layerLabel').textContent='Y '+label;document.querySelector('#layerCaption').textContent=(currentZone==='all'?'Toàn bộ khối công trình':currentZone==='palace'?'Cung điện':currentZone==='wall'?'Tường thành & tháp':currentZone==='yard'?'Sân trong & đường':'Kho / lính / chuồng')+' · '+label;}
function snap(label,subtitle){const data=renderer.domElement.toDataURL('image/png');const card=document.createElement('button');card.className='shot-card';card.innerHTML=`<img alt="${label}" src="${data}"><span><b>${label}<i class="shot-arrow">↗</i></b><small>${subtitle}</small></span>`;card.addEventListener('click',()=>{const a=document.createElement('a');a.href=data;a.download='stonewatch-'+label.toLowerCase().replaceAll(' ','-')+'.png';a.click()});document.querySelector('#shotList').prepend(card);while(document.querySelectorAll('.shot-card').length>3)document.querySelector('#shotList').lastElementChild.remove();}
function capture(label='Custom angle'){snap(label,'PNG · current camera')}
document.querySelector('#layerSlider').addEventListener('input',e=>{maxLayer=Number(e.target.value);updateBlocks()});document.querySelector('#upBtn').onclick=()=>{maxLayer=Math.min(12,maxLayer+1);document.querySelector('#layerSlider').value=maxLayer;updateBlocks()};document.querySelector('#downBtn').onclick=()=>{maxLayer=Math.max(0,maxLayer-1);document.querySelector('#layerSlider').value=maxLayer;updateBlocks()};
document.querySelectorAll('.legend-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.legend-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentZone=b.dataset.zone;updateBlocks()});
document.querySelectorAll('.view-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.view-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');const v=b.dataset.view;if(v==='top'){setCamera('top');maxLayer=12}else if(v==='section'){setCamera('section');maxLayer=6}else{setCamera('hero');maxLayer=12}document.querySelector('#layerSlider').value=maxLayer;updateBlocks()});
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{setCamera(b.dataset.preset);if(b.dataset.preset==='section'){maxLayer=6;document.querySelector('#layerSlider').value=6;updateBlocks()}});
document.querySelector('#rotateBtn').onclick=()=>{autoRotate=!autoRotate;controls.autoRotate=autoRotate;document.querySelector('#rotateBtn').style.background=autoRotate?'#dfeab9':'transparent'};
document.querySelector('#gridBtn').onclick=()=>{gridVisible=!gridVisible;grid.visible=gridVisible;document.querySelector('#gridBtn').style.background=gridVisible?'transparent':'#e1e2d8'};
document.querySelector('#resetBtn').onclick=()=>setCamera('hero');document.querySelector('#captureBtn').onclick=()=>capture('Custom angle');document.querySelector('#downloadBtn').onclick=()=>{const a=document.createElement('a');a.href=renderer.domElement.toDataURL('image/png');a.download='stonewatch-castle.png';a.click()};
updateBlocks();
function seedShots(){setCamera('hero');renderer.render(scene,camera);snap('Hero angle','3/4 · 62° elevation');setCamera('top');renderer.render(scene,camera);snap('Top-down plan','orthographic read');setCamera('court');renderer.render(scene,camera);snap('Courtyard','inside wall view');setCamera('hero');}
function animate(){requestAnimationFrame(animate);if(controls.autoRotate){const o=camera.position.clone().sub(controls.target);const s=new THREE.Spherical().setFromVector3(o);s.theta+=.0025;o.setFromSpherical(s);camera.position.copy(controls.target).add(o);camera.lookAt(controls.target)}renderer.render(scene,camera)} animate();setTimeout(seedShots,450);
