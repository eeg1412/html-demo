import {GameModel,SKILLS,PLATFORMS,WORLD,FLOOR,xpNeeded,clamp} from './engine.js?v=2';
import {HeroAnimator,smoothSource,createHeroClips} from './hero-animation.js?v=2';
import {HERO_ASSETS} from './hero-assets.js?v=2';
import {WalkRig} from './walk-rig.js?v=2';
const $=id=>document.getElementById(id),P=globalThis.PIXI;
const input={left:false,right:false,jump:false,skills:[false,false,false]};
let app,world,bgLayer,fxLayer,hero,heroAnimator,heroFrames,monsterTexture,portraitCanvas,game,viewW=1200,viewH=720,camera=0,scale=1,uiTimer=0,lastSave=0,toastTimer=0,panelType='',wasPaused=false,soundEnabled=false,audioContext,ready=false;
const monsterViews=new Map(),particles=[],floaters=[],effects=[];
const SAVE_KEY='petal-story-v1';
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{return {};}}
function save(){if(!game)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.serialize()));}catch{$('saveNote').textContent='此浏览器无法保存，当前进度仅在本次有效';}}
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');toastTimer=3;}
function tone(freq,duration=.13,type='sine',gain=.035){if(!soundEnabled)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const osc=audioContext.createOscillator(),amp=audioContext.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.7,audioContext.currentTime+duration);amp.gain.setValueAtTime(gain,audioContext.currentTime);amp.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(amp);amp.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch{}}
function textSprite(text,size,color,stroke=0x3c6455){const t=new P.Text({text,style:{fontFamily:'Arial, sans-serif',fontSize:size,fontWeight:'bold',fill:color,stroke:{color:stroke,width:size>20?4:3},dropShadow:{color:0x254a40,alpha:.2,blur:3,distance:2}}});t.anchor.set(.5);return t;}
function floating(text,x,y,color=0xfff3c5,size=25){if(!fxLayer)return;const t=textSprite(text,size,color);t.position.set(x,y);fxLayer.addChild(t);floaters.push({node:t,life:1.05,max:1.05,vy:-48});}
function burst(x,y,color,count=18,speed=130){if(!fxLayer)return;for(let i=0;i<count;i++){const g=new P.Graphics().ellipse(0,0,2+Math.random()*3,2).fill(color);g.position.set(x,y);g.rotation=Math.random()*6.28;fxLayer.addChild(g);const a=Math.random()*6.28,v=30+Math.random()*speed;particles.push({node:g,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.6+Math.random()*.8,max:1.4,gravity:65});}}
function ring(x,y,color,radius,kind='ring',facing=1){if(!fxLayer)return;const node=new P.Graphics();node.position.set(x,y);fxLayer.addChild(node);effects.push({node,life:kind==='rain'?1.1:.45,max:kind==='rain'?1.1:.45,radius,color,kind,facing});}
function onEvent(type,e){
  if(type==='cast'){$('welcome').classList.add('hidden');if(e.i>0)ring(e.x+e.facing*16,e.y,0xe5fff1,35,'cast',e.facing);}
  if(type==='hit'){floating(e.damage,e.x+(Math.random()-.5)*20,e.y,0xffefb6);burst(e.x,e.y+15,0xffd7e2,7);tone(400,.07);}
  if(type==='kill'){floating('+'+e.xp+' EXP',e.x,e.y-65,0xe9ffcb,15);burst(e.x,e.y,0xbbeac7,16);save();}
  if(type==='skill'){const color=[0xf7a8c7,0x91e7d7,0xffe1a0][e.i];ring(e.x,e.y,color,SKILLS[e.i].range,e.i===0?'slash':e.i===2?'rain':'cast',e.facing);burst(e.x,e.y,color,e.i===2?35:10);tone([720,1050,1300][e.i],.22);$('welcome').classList.add('hidden');}
  if(type==='level'){notify('✦ 升级！Lv. '+e.level+' · 属性 +5 · 技能 +3');floating('LEVEL UP',game.player.x,game.player.y-155,0xffe1a0,30);ring(game.player.x,game.player.y-45,0xffe5a6,200,'rain');burst(game.player.x,game.player.y-60,0xffefb3,45,200);tone(1400,.5);save();}
  if(type==='hurt'){floating('−'+e.damage,e.x,e.y,0xffb6c1,20);tone(180,.12,'triangle');}
  if(type==='death'){burst(e.x,e.y,0xffc6df,65,210);$('death').classList.remove('hidden');save();tone(250,.7);}
  if(type==='respawn'){$('death').classList.add('hidden');burst(e.x,e.y,0xcaffde,35);ring(e.x,e.y,0xe4ffe6,130);notify('在花铃石重生 · 3 秒守护');}
  if(type==='mana')notify('魔力不足，稍等片刻就会恢复');
  if(type==='upgrade'){save();renderPanel();updateUI();tone(950,.15);}
  if(type==='jump'){$('welcome').classList.add('hidden');tone(470,.12);}
}
// Extract frame bounds from generated alpha atlas, keeping real generated artwork.
async function atlas(url,cols,rows,rects){const source=await P.Assets.load(url);smoothSource(source.source);const img=new Image();img.src=url;await img.decode();if(rects)return {frames:rects.map(([x,y,x2,y2])=>new P.Texture({source:source.source,frame:new P.Rectangle(x,y,x2-x,y2-y)})),image:img};const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;const cellW=Math.floor(c.width/cols),cellH=Math.floor(c.height/rows),frames=[];
  for(let i=0;i<cols*rows;i++){const ox=(i%cols)*cellW,oy=Math.floor(i/cols)*cellH;let minX=cellW,minY=cellH,maxX=0,maxY=0;for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++){if(data[((oy+y)*c.width+ox+x)*4+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}if(minX>maxX){minX=0;minY=0;maxX=cellW-1;maxY=cellH-1;}const rect=new P.Rectangle(ox+minX,oy+minY,maxX-minX+1,maxY-minY+1);frames.push(new P.Texture({source:source.source,frame:rect}));}
  return {frames,image:img};
}
function addSprite(texture,x,y,width,height,parent=world){const s=new P.Sprite(texture);s.position.set(x,y);s.width=width;s.height=height;parent.addChild(s);return s;}
async function sequenceAtlas(spec){
  const {url,cols,rows}=spec;const texture=await P.Assets.load(url);smoothSource(texture.source);
  const w=texture.width/cols,h=texture.height/rows;
  if(spec.frames){
    const frames=spec.frames.map(({rect:[x,y,x2,y2]})=>new P.Texture({source:texture.source,frame:new P.Rectangle(x,y,x2-x,y2-y)}));
    const anchors=spec.frames.map(({rect:[x,y,x2,y2],pivot:[px,py]})=>({x:(px-x)/(x2-x),y:(py-y)/(y2-y)}));
    return {frames,anchors,width:w,height:h,spec};
  }
  return {frames:Array.from({length:cols*rows},(_,i)=>new P.Texture({source:texture.source,frame:new P.Rectangle((i%cols)*w,Math.floor(i/cols)*h,w,h)})),width:w,height:h,spec};
}
async function init(){
  if(!P)throw new Error('渲染引擎未能加载，请刷新重试。');
  app=new P.Application();await app.init({resizeTo:$('game'),background:0xb9d8ce,antialias:true,resolution:Math.min(Math.max(devicePixelRatio||1,2),3),autoDensity:true,roundPixels:false,preference:'webgl'});$('game').appendChild(app.canvas);
  const [heroAtlas,objects,forest,slashAtlas,magicAtlas]=await Promise.all([atlas('assets/hero.png',4,2,[[80,39,352,503],[420,40,740,502],[788,40,1089,502],[1174,28,1490,441],[20,560,449,970],[457,521,755,981],[797,576,1108,968],[1115,740,1528,958]]),atlas('assets/objects.png',2,2,[[122,132,509,505],[635,260,1240,480],[58,653,570,1182],[651,721,1221,1127]]),P.Assets.load('assets/forest.png'),sequenceAtlas(HERO_ASSETS.slash),sequenceAtlas(HERO_ASSETS.magic)]);
  smoothSource(forest.source);
  heroFrames=heroAtlas.frames;monsterTexture=objects.frames[0];
  bgLayer=new P.Container();app.stage.addChild(bgLayer);const back=new P.Sprite(forest);bgLayer.addChild(back);
  world=new P.Container();app.stage.addChild(world);
  // Grass shelves use the generated side-view terrain tile for visible collision surfaces.
  for(let x=0;x<WORLD;x+=290)addSprite(objects.frames[1],x,FLOOR-7,300,128);
  for(const platform of PLATFORMS.slice(1))addSprite(objects.frames[1],platform.x,platform.y-7,platform.w,96);
  const shrine=addSprite(objects.frames[2],125,FLOOR-130,130,145);shrine.alpha=.94;
  const shrineName=textSprite('花铃石',13,0xf3ffdd);shrineName.position.set(190,FLOOR-140);world.addChild(shrineName);
  for(const x of [35,890,1780,2440,3060]){const d=addSprite(objects.frames[3],x,FLOOR-50,110,62);d.alpha=.9;}
  const shadow=new P.Graphics().ellipse(0,0,28,7).fill({color:0x3c6960,alpha:.18});world.addChild(shadow);
  heroAnimator=new HeroAnimator(P,createHeroClips(heroFrames,null,slashAtlas,magicAtlas),new WalkRig(P,magicAtlas.frames[0].source));
  hero=heroAnimator.root;world.addChild(hero);
  const nameplate=textSprite('软棉棉',13,0xfff8ed);world.addChild(nameplate);
  fxLayer=new P.Container();world.addChild(fxLayer);
  const ambient=new P.Container();app.stage.addChild(ambient);const motes=[];for(let i=0;i<32;i++){const g=new P.Graphics().ellipse(0,0,2.2,1.3).fill(i%3?0xffffff:0xffc5d7);ambient.addChild(g);motes.push({node:g,x:Math.random(),y:Math.random(),speed:Math.random()+.3});}
  game=new GameModel(readSave(),onEvent);
  $('minimap').querySelector('path').setAttribute('d',PLATFORMS.map(p=>`M${8+p.x/WORLD*234} ${64-(FLOOR-p.y)*.12}h${p.w/WORLD*234}`).join(' '));
  const rect=heroFrames[0].frame;portraitCanvas=document.createElement('canvas');portraitCanvas.width=240;portraitCanvas.height=240;const pc=portraitCanvas.getContext('2d');const factor=205/rect.width;pc.imageSmoothingEnabled=true;pc.imageSmoothingQuality='high';pc.drawImage(heroAtlas.image,rect.x,rect.y,rect.width,rect.height,(240-rect.width*factor)/2,4,rect.width*factor,rect.height*factor);$('portrait').appendChild(portraitCanvas);
  const projGraphics=new P.Graphics();fxLayer.addChild(projGraphics);
  function resize(){const w=app.screen.width,h=app.screen.height;scale=h/720;viewH=720;viewW=w/scale;world.scale.set(scale);const bs=Math.max(w/forest.width,h/forest.height)*1.05;back.scale.set(bs);back.y=(h-back.height)*.42;}
  const observer=new ResizeObserver(resize);observer.observe($('game'));resize();
  ready=true;$('loading').classList.add('hidden');updateUI();
  app.ticker.add(ticker=>{const dt=Math.min(ticker.deltaMS/1000,.04);game.update(dt,input);const p=game.player;
    camera=clamp(p.x-viewW*.38,0,Math.max(0,WORLD-viewW));world.x=-camera*scale;back.x=(app.screen.width-back.width)/2-(camera/(WORLD-viewW||1)-.5)*35;
    heroAnimator.update(p,dt,game.paused);
    if(!p.dead&&p.invuln>0)hero.alpha=.72+Math.sin(game.time*18)*.18;
    shadow.position.set(p.x,p.y+1);shadow.alpha=p.dead?.1:.8;nameplate.position.set(p.x,p.y-126);nameplate.visible=!p.dead;
    for(const m of game.monsters){let v=monsterViews.get(m);if(!v){const c=new P.Container(),s=new P.Sprite(monsterTexture);s.anchor.set(.5,1);c.addChild(s);const bar=new P.Graphics();c.addChild(bar);const label=textSprite('',11,0xf5ffdf);label.position.set(0,-78);c.addChild(label);v={c,s,bar,label};monsterViews.set(m,v);world.addChildAt(c,Math.max(0,world.children.indexOf(hero)));}v.c.position.set(m.x,m.y);v.c.visible=!m.dead;const hop=Math.sin(game.time*5+m.phase);v.s.scale.set((66/monsterTexture.width)*(1+hop*.035)*-m.dir,(64/monsterTexture.height)*(1-hop*.04));v.s.y=-Math.max(0,hop)*5;v.s.tint=m.hit?0xffb8ca:0xffffff;v.label.text='芽芽 Lv.'+m.level;v.bar.clear();v.bar.roundRect(-25,-66,50,5,2).fill({color:0x31544b,alpha:.5}).roundRect(-25,-66,50*Math.max(0,m.hp/m.maxHp),5,2).fill(0xb8dc8d);}
    projGraphics.clear();for(const q of game.projectiles){projGraphics.moveTo(q.x-q.dir*38,q.y).lineTo(q.x,q.y).stroke({color:0x9ce9db,width:10,alpha:.35});projGraphics.circle(q.x,q.y,8).fill(0xc1fff0).circle(q.x,q.y,4).fill(0xffffff);}
    const animDt=game.paused?0:dt;
    for(let i=particles.length-1;i>=0;i--){const f=particles[i];f.life-=animDt;if(f.life<=0){f.node.destroy();particles.splice(i,1);continue;}f.node.x+=f.vx*animDt;f.node.y+=f.vy*animDt;f.vy+=f.gravity*animDt;f.node.rotation+=animDt*2;f.node.alpha=Math.min(1,f.life/.4);}
    for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.life-=animDt;f.node.y+=f.vy*animDt;f.node.alpha=Math.min(1,f.life/.35);if(f.life<=0){f.node.destroy();floaters.splice(i,1);}}
    for(let i=effects.length-1;i>=0;i--){const f=effects[i];f.life-=animDt;if(f.life<=0){f.node.destroy();effects.splice(i,1);continue;}const progress=1-f.life/f.max;f.node.clear();f.node.alpha=1-progress;
      if(f.kind==='slash'){f.node.scale.x=f.facing;f.node.arc(0,0,90+progress*50,-1.2,1.2).stroke({color:f.color,width:19*(1-progress)+2});f.node.arc(0,0,82+progress*50,-1.1,1.1).stroke({color:0xffffff,width:5});}
      else if(f.kind==='rain'){f.node.ellipse(0,45,f.radius*progress,40*progress).stroke({color:f.color,width:4});for(let j=0;j<9;j++){const xx=Math.sin(j*21.7)*f.radius*.85,yy=-190+(progress*310+j*29)%300;f.node.moveTo(xx,yy).lineTo(xx-8,yy+45).stroke({color:f.color,width:4,alpha:.8});}f.node.circle(0,0,50+progress*60).stroke({color:f.color,width:2});}
      else f.node.circle(0,0,15+progress*Math.min(f.radius,120)).stroke({color:f.color,width:4});
    }
    for(const m of motes){m.node.x=(m.x*app.screen.width+game.time*m.speed*8)%(app.screen.width+20);m.node.y=(m.y*app.screen.height+Math.sin(game.time*.3+m.x*20)*20);m.node.alpha=.4+Math.sin(game.time+m.x*30)*.25;}
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}uiTimer+=dt;lastSave+=dt;if(uiTimer>.1){updateUI();uiTimer=0;}if(lastSave>5){save();lastSave=0;}
  });
}
function updateUI(){if(!game)return;const p=game.player;$('level').textContent='Lv. '+game.level;$('hpFill').style.width=(p.hp/game.maxHp*100)+'%';$('mpFill').style.width=(p.mp/game.maxMp*100)+'%';$('hpText').textContent=`HP ${Math.ceil(p.hp)} / ${game.maxHp}`;$('mpText').textContent=`MP ${Math.floor(p.mp)} / ${game.maxMp}`;$('xpFill').style.width=(game.level===999?100:game.xp/xpNeeded(game.level)*100)+'%';$('xpText').textContent=game.level===999?'Lv. 999 · MAX':`EXP ${game.xp} / ${xpNeeded(game.level)} · ${Math.floor(game.xp/xpNeeded(game.level)*100)}%`;
  $('monsterLevel').textContent='Lv. '+game.level;$('killText').textContent='击败 '+game.kills+' 只魔物';for(let i=0;i<3;i++){$('sl'+i).textContent='Lv. '+game.skillLevels[i];$('cd'+i).style.display=game.cooldowns[i]>.05?'flex':'none';$('cd'+i).textContent=game.cooldowns[i].toFixed(1);}
  for(const [id,n] of [['statBadge',game.statPoints],['skillBadge',game.skillPoints]]){$(id).hidden=n<=0;$(id).textContent=n;}
  $('mapPlayer').setAttribute('cx',8+p.x/WORLD*234);$('mapPlayer').setAttribute('cy',64-(FLOOR-p.y)*.12);$('mapMonsters').innerHTML=game.monsters.filter(m=>!m.dead).map(m=>`<circle cx="${8+m.x/WORLD*234}" cy="${64-(FLOOR-m.y)*.12}" r="1.9" fill="#9bba7e"/>`).join('');
  if(p.dead)$('respawnText').textContent=Math.max(1,Math.ceil(p.dead))+' 秒后在本地图重生';
}
function clearInput(){input.left=input.right=input.jump=false;input.skills.fill(false);document.querySelectorAll('.active').forEach(e=>e.classList.remove('active'));}
function pause(value){if(!game||$('panel').open)return;game.paused=value;clearInput();$('paused').classList.toggle('hidden',!value);$('pauseBtn').textContent=value?'▷':'Ⅱ';$('pauseBtn').setAttribute('aria-label',value?'继续游戏':'暂停游戏');}
function openPanel(type){if(!ready)return;wasPaused=game.paused;game.paused=true;clearInput();panelType=type;renderPanel();$('panel').showModal();}
function renderPanel(){if(!game)return;const stat=panelType==='stats',help=panelType==='help';$('panelTitle').textContent=help?'冒险指南':stat?'软棉棉 · 属性':'花之魔法';$('panelEyebrow').textContent=help?'HOW TO PLAY':stat?'CHARACTER · LV. '+game.level:'SKILLS & MAGIC';
  if(help){$('panelBody').innerHTML='<div class="help-list"><p><b>电脑操作</b><br><kbd>A</kbd> <kbd>D</kbd> 或方向键移动，<kbd>空格</kbd> 跳跃<br><kbd>J</kbd> 落花斩 · <kbd>K</kbd> 铃光弹 · <kbd>L</kbd> 花雨绽放<br><kbd>C</kbd> 属性 · <kbd>V</kbd> 技能 · <kbd>Esc</kbd> 暂停</p><p><b>手机操作</b><br>按住左右箭头移动，点击 ↑ 跳跃。<br>按住技能按钮可连续施放，支持同时移动和攻击。</p><p><b>冒险与成长</b><br>击败芽芽史莱姆获得经验。每级获得 5 属性点、3 技能点；人物、属性和技能等级最高 999。魔物随你的等级同步变强。<br>死亡后 3 秒在花铃石重生，保留全部养成进度。魔力自动恢复；升级和重生恢复生命。</p></div><p class="panel-foot">进度保存在当前浏览器。切换设备不会同步；清除浏览器数据会删除存档。横屏可获得更宽阔的视野。</p>';return;}
  const points=stat?game.statPoints:game.skillPoints;const rows=stat?[{name:'力量',icon:'♧',description:'每级提升 3 点攻击力'},{name:'体质',icon:'♡',description:'每级提升 14 点生命与防御'},{name:'灵性',icon:'✧',description:'每级提升 3 点魔力与恢复速度'}]:SKILLS;
  $('panelBody').innerHTML=`<div class="panel-summary">可用${stat?'属性':'技能'}点 <b>${points}</b> <span>· 每次升级获得 ${stat?5:3} 点</span></div>`+rows.map((s,i)=>{const val=(stat?game.stats:game.skillLevels)[i];return `<div class="upgrade-row"><span class="upgrade-icon">${s.icon}</span><div class="upgrade-info"><b>${s.name}</b><small>${s.description}</small>${!stat?`<small>伤害 ${game.damageFor(i)} · 魔力 ${s.cost} · ${s.cooldown} 秒</small>`:''}</div><span class="upgrade-value">${val}</span><button data-upgrade="${i}" aria-label="提升${s.name}" ${points<=0||val>=999?'disabled':''}>+</button></div>`;}).join('')+(stat?`<div class="derived"><div><span>攻击力</span><b>${game.attack}</b></div><div><span>防御力</span><b>${game.defense}</b></div><div><span>最大生命</span><b>${game.maxHp}</b></div><div><span>最大魔力</span><b>${game.maxMp}</b></div></div>`:'')+'<p class="panel-foot">等级上限 999 · 点击 + 分配成长点<br>打开面板时，冒险会自动暂停。</p>';
  document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>game.upgrade(stat?'stat':'skill',Number(b.dataset.upgrade)));
}
$('closePanel').onclick=()=>$('panel').close();$('panel').addEventListener('close',()=>{if(game)game.paused=wasPaused;clearInput();});$('panel').addEventListener('click',e=>{if(e.target===$('panel')){const r=$('panel').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('panel').close();}});
$('statsBtn').onclick=()=>openPanel('stats');$('skillsBtn').onclick=()=>openPanel('skills');$('helpBtn').onclick=()=>openPanel('help');$('pauseBtn').onclick=()=>pause(!game?.paused);$('resumeBtn').onclick=()=>pause(false);$('dismissWelcome').onclick=()=>$('welcome').classList.add('hidden');
$('soundBtn').onclick=()=>{soundEnabled=!soundEnabled;$('soundBtn').classList.toggle('on',soundEnabled);$('soundBtn').setAttribute('aria-label',soundEnabled?'关闭音效':'开启音效');tone(800,.15);};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('shell').requestFullscreen)await $('shell').requestFullscreen();else notify('此设备可使用浏览器的横屏模式');}catch{notify('此浏览器暂不支持全屏，试试横屏游玩');}};
const keys={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};
window.addEventListener('keydown',e=>{if(!ready)return;if($('panel').open)return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause(!game.paused);return;}if(['KeyC','KeyV'].includes(e.code)){if(!e.repeat)openPanel(e.code==='KeyC'?'stats':'skills');return;}if(keys[e.code]){e.preventDefault();input[keys[e.code]]=true;if(keys[e.code]!=='jump')$('welcome').classList.add('hidden');}const i=['KeyJ','KeyK','KeyL'].indexOf(e.code);if(i>=0){e.preventDefault();input.skills[i]=true;}});
window.addEventListener('keyup',e=>{if(keys[e.code])input[keys[e.code]]=false;const i=['KeyJ','KeyK','KeyL'].indexOf(e.code);if(i>=0)input.skills[i]=false;});
function bindHold(button,set){button.addEventListener('pointerdown',e=>{e.preventDefault();if(!ready||game.paused)return;button.setPointerCapture(e.pointerId);set(true);button.classList.add('active');});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{set(false);button.classList.remove('active');});}
document.querySelectorAll('[data-hold]').forEach(b=>bindHold(b,v=>{input[b.dataset.hold]=v;if(v)$('welcome').classList.add('hidden');}));bindHold($('jumpBtn'),v=>input.jump=v);document.querySelectorAll('[data-skill]').forEach(b=>bindHold(b,v=>{const i=Number(b.dataset.skill);input.skills[i]=v;if(v)game.useSkill(i);}));
window.addEventListener('blur',()=>{clearInput();if(ready&&!$('panel').open)pause(true);save();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(ready&&!$('panel').open)pause(true);save();}});window.addEventListener('pagehide',save);
init().catch(error=>{console.error(error);$('loadText').textContent='原野暂时没有醒来：'+error.message;const b=document.createElement('button');b.className='primary';b.textContent='重新加载';b.onclick=()=>location.reload();$('loading').appendChild(b);});
