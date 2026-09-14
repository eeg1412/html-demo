import {GameModel,SKILLS,FLOOR,xpNeeded,clamp} from './engine.js?v=19';
import {bindJoystick} from './mobile-controls.js?v=14';
import {HeroAnimator,smoothSource,createHeroClips} from './hero-animation.js?v=12';
import {HERO_ASSETS} from './hero-assets.js?v=13';
import {MapScene,CANDY_URLS} from './map-scene.js?v=17';
import {monsterAppearance,deathFrames} from './monster-animation.js?v=18';
import {MONSTER_DEATH_ART} from './monster-death-art.js?v=18';
import {CANDY_ART} from './candy-art.js?v=16';
import {AssetLoader} from './asset-loader.js?v=19';
import {GLOBAL_ASSETS,MAP_ASSETS} from './asset-manifest.js?v=19';
import {MAPS} from './maps.js?v=15';
const $=id=>document.getElementById(id),P=globalThis.PIXI;
const input={left:false,right:false,jump:false,down:false,touchJump:false,interact:false,skills:[false,false,false]};
let resetTouch=()=>{};
let app,world,mapScene,resources,transitioning=false,pauseAfterLoad=false,fxLayer,hero,heroAnimator,heroFrames,monsterTexture,candyFrames,monsterDeaths,portraitCanvas,game,viewW=1200,viewH=720,camera=0,scale=1,uiTimer=0,lastSave=0,toastTimer=0,panelType='',wasPaused=false,soundEnabled=false,audioContext,ready=false;
const monsterViews=new Map(),particles=[],floaters=[],effects=[];
const SAVE_KEY='petal-story-v1';
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch{return {};}}
function save(){if(!game)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.serialize()));}catch{$('saveNote').textContent='此浏览器无法保存，当前进度仅在本次有效';}}
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');toastTimer=3;}
function tone(freq,duration=.13,type='sine',gain=.035){if(!soundEnabled)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const osc=audioContext.createOscillator(),amp=audioContext.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.7,audioContext.currentTime+duration);amp.gain.setValueAtTime(gain,audioContext.currentTime);amp.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(amp);amp.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch{}}
function textSprite(text,size,color,stroke=0x191c25){const t=new P.Text({text,style:{fontFamily:'Arial, sans-serif',fontSize:size,fontWeight:'bold',fill:color,stroke:{color:stroke,width:size>20?4:3},dropShadow:{color:0x191c25,alpha:.2,blur:3,distance:2}}});t.anchor.set(.5);return t;}
function floating(text,x,y,color=0xfff3c5,size=25){if(!fxLayer)return;const t=textSprite(text,size,color);t.position.set(x,y);fxLayer.addChild(t);floaters.push({node:t,life:1.05,max:1.05,vy:-48});}
function burst(x,y,color,count=18,speed=130){if(!fxLayer)return;for(let i=0;i<count;i++){const g=new P.Graphics().ellipse(0,0,2+Math.random()*3,2).fill(color);g.position.set(x,y);g.rotation=Math.random()*6.28;fxLayer.addChild(g);const a=Math.random()*6.28,v=30+Math.random()*speed;particles.push({node:g,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.6+Math.random()*.8,max:1.4,gravity:65});}}
function ring(x,y,color,radius,kind='ring',facing=1){if(!fxLayer)return;const node=new P.Graphics();node.position.set(x,y);fxLayer.addChild(node);effects.push({node,life:kind==='rain'?1.1:.45,max:kind==='rain'?1.1:.45,radius,color,kind,facing});}
function onEvent(type,e){
  if(type==='map'){clearInput();save();notify('抵达 '+game.map.name);tone(1100,.4);}
  if(type==='cast'){$('welcome').classList.add('hidden');if(e.i>0)ring(e.x+e.facing*16,e.y,0xe5fff1,35,'cast',e.facing);}
  if(type==='hit'){floating(e.damage,e.x+(Math.random()-.5)*20,e.y,0xffefb6);burst(e.x,e.y+15,0xffd7e2,7);tone(400,.07);}
  if(type==='kill'){floating('+'+e.xp+' EXP',e.x,e.y-65,0xe9ffcb,15);save();}
  if(type==='skill'){const color=[0xf7a8c7,0x91e7d7,0xffe1a0][e.i];ring(e.x,e.y,color,SKILLS[e.i].range,e.i===0?'slash':e.i===2?'rain':'cast',e.facing);burst(e.x,e.y,color,e.i===2?35:10);tone([720,1050,1300][e.i],.22);$('welcome').classList.add('hidden');}
  if(type==='level'){notify('✦ 升级！Lv. '+e.level+' · 属性 +5 · 技能 +3');floating('LEVEL UP',game.player.x,game.player.y-155,0xffe1a0,30);ring(game.player.x,game.player.y-45,0xffe5a6,200,'rain');burst(game.player.x,game.player.y-60,0xffefb3,45,200);tone(1400,.5);save();}
  if(type==='hurt'){floating('−'+e.damage,e.x,e.y,0xffb6c1,20);tone(180,.12,'triangle');}
  if(type==='death'){burst(e.x,e.y,0xffc6df,65,210);$('death').classList.remove('hidden');save();tone(250,.7);}
  if(type==='respawn'){$('death').classList.add('hidden');burst(e.x,e.y,0xcaffde,35);ring(e.x,e.y,0xe4ffe6,130);notify('在'+(game.map.id==='candy'?'糖铃石':'花铃石')+'重生 · 3 秒守护');}
  if(type==='mana')notify('魔力不足，稍等片刻就会恢复');
  if(type==='upgrade'){save();renderPanel();updateUI();tone(950,.15);}
  if(type==='jump'){$('welcome').classList.add('hidden');tone(470,.12);}
}
// Slice already-decoded textures; never load the same URL again for a portrait or clip.
function atlas(url,rects){const texture=resources.get(url);return {frames:rects.map(([x,y,x2,y2])=>new P.Texture({source:texture.source,frame:new P.Rectangle(x,y,x2-x,y2-y)})),image:texture.source.resource};}
function sequenceAtlas(spec){
  const texture=resources.get(spec.url),w=texture.width/spec.cols,h=texture.height/spec.rows;
  const frames=spec.frames.map(({rect:[x,y,x2,y2]})=>new P.Texture({source:texture.source,frame:new P.Rectangle(x,y,x2-x,y2-y)}));
  const anchors=spec.frames.map(({rect:[x,y,x2,y2],pivot:[px,py]})=>({x:(px-x)/(x2-x),y:(py-y)/(y2-y)}));
  return {frames,anchors,width:w,height:h,spec};
}
function loadingProgress({completed,total,ratio}){
  const percent=Math.floor(ratio*100);$('loadProgress').value=percent;
  $('loadDetail').textContent=percent+'% · '+completed+' / '+total+' 项资源';
}
async function loadResources(title,task,allowCancel=false){
  $('loading').classList.remove('hidden');$('loading').setAttribute('aria-busy','true');
  for(;;){
    $('loadText').textContent=title;$('retryLoad').classList.add('hidden');$('cancelLoad').classList.add('hidden');
    try{return await task(loadingProgress);}
    catch(error){
      console.error(error);$('loading').setAttribute('aria-busy','false');
      $('loadText').textContent='加载未完成，请检查网络后重试。';
      $('retryLoad').classList.remove('hidden');$('cancelLoad').classList.toggle('hidden',!allowCancel);
      const retry=await new Promise(resolve=>{$('retryLoad').onclick=()=>resolve(true);$('cancelLoad').onclick=()=>resolve(false);});
      if(!retry)return null;$('loading').setAttribute('aria-busy','true');
    }
  }
}
function finishLoading(){
  $('loading').classList.add('hidden');$('loading').setAttribute('aria-busy','false');
  $('retryLoad').onclick=$('cancelLoad').onclick=null;
}
async function init(){
  if(!P)throw new Error('渲染引擎未能加载，请刷新重试。');
  app=new P.Application();await app.init({resizeTo:$('game'),background:0xb9d8ce,antialias:true,resolution:Math.min(Math.max(devicePixelRatio||1,2),3),autoDensity:true,roundPixels:false,preference:'webgl'});$('game').appendChild(app.canvas);
  game=new GameModel(readSave(),onEvent);
  resources=new AssetLoader({load:async url=>{const texture=await P.Assets.load(url);smoothSource(texture.source);return texture;},unload:url=>P.Assets.unload(url)},GLOBAL_ASSETS,MAP_ASSETS);
  const initialAssets=await loadResources('正在加载主角与'+game.map.name+'…',progress=>resources.startup(game.map.id,progress));
  $('loadText').textContent='正在准备场景…';
  const heroAtlas=atlas('assets/hero.webp',[[80,39,352,503],[420,40,740,502],[788,40,1089,502],[1174,28,1490,441],[20,560,449,970],[457,521,755,981],[797,576,1108,968],[1115,740,1528,958]]);
  heroFrames=heroAtlas.frames;
  const [walkAtlas,slashAtlas,boltAtlas,rainAtlas,reactionAtlas,idleAtlas]=['walk','slash','bolt','rain','reaction','idle'].map(k=>sequenceAtlas(HERO_ASSETS[k]));
  world=new P.Container();app.stage.addChild(world);
  heroAnimator=new HeroAnimator(P,createHeroClips(heroFrames,walkAtlas,slashAtlas,boltAtlas,rainAtlas,reactionAtlas,idleAtlas));
  hero=heroAnimator.root;world.addChild(hero);
  const nameplate=textSprite('软棉棉',13,0xfff8ed);world.addChild(nameplate);
  fxLayer=new P.Container();world.addChild(fxLayer);
  const ambient=new P.Container();app.stage.addChild(ambient);const motes=[];for(let i=0;i<32;i++){const g=new P.Graphics().ellipse(0,0,2.2,1.3).fill(i%3?0xffffff:0xffc5d7);ambient.addChild(g);motes.push({node:g,x:Math.random(),y:Math.random(),speed:Math.random()+.3});}
  function prepareMap(id,mapAssets){
    const objects=id==='meadow'?atlas('assets/objects.webp',[[122,132,509,505],[635,260,1240,480],[58,653,570,1182],[651,721,1221,1127]]).frames:[];
    const candy=id==='candy'?CANDY_ART.monster.map(([x,y,w,h])=>new P.Texture({source:mapAssets[CANDY_URLS[2]].source,frame:new P.Rectangle(x,y,w,h)})):[];
    const deaths=deathFrames(P,mapAssets[MONSTER_DEATH_ART[id].url],MONSTER_DEATH_ART[id]);
    return {scene:new MapScene(P,MAPS[id],mapAssets,objects,textSprite),monster:objects[0]||candy[0],candy,deaths};
  }
  function showMap(view){
    mapScene?.destroy();for(const v of monsterViews.values())v.c.destroy({children:true});monsterViews.clear();
    for(const list of [particles,floaters,effects]){for(const f of list)f.node.destroy();list.length=0;}
    mapScene=view.scene;monsterTexture=view.monster;candyFrames=view.candy;monsterDeaths={[game.map.id]:view.deaths};world.addChildAt(mapScene.terrain,0);app.stage.addChildAt(mapScene.back,0);app.stage.addChildAt(mapScene.front,app.stage.children.indexOf(world)+1);
    document.title='花铃物语 · '+game.map.name;
    $('welcome').querySelector('p').textContent=game.map.id==='candy'?'欢迎来到绵糖梦境。左侧传送口可以返回原野。':'向原野最右侧前进，穿过传送口探索绵糖梦境。';
    document.querySelector('.region b').textContent=game.map.name;document.querySelector('.region-tag').textContent=game.map.subtitle;
    document.querySelector('.map-title span').textContent='✧ '+game.map.name;document.querySelector('.map-title small').textContent=game.map.id==='candy'?'02':'01';document.querySelector('.map-meta span').textContent=game.map.monster;
    document.querySelector('.location-label span').textContent=game.map.english;document.querySelector('.location-label b').textContent=game.map.poem;
    document.querySelector('.footer-line span').textContent=game.map.name+' · 自由探索';$('arena').setAttribute('aria-label',game.map.name+'游戏区域');
    $('death').querySelector('p').textContent='你化作了飘散的花瓣，'+(game.map.id==='candy'?'糖铃石':'花铃石')+'正呼唤你。';
    $('minimap').querySelector('path').setAttribute('d',game.map.platforms.map(p=>`M${8+p.x/game.map.width*234} ${64-(FLOOR-p.y)*.12}h${p.w/game.map.width*234}`).join(' '));
    $('mapPortal').setAttribute('cx',8+game.map.portal.x/game.map.width*234);resize();camera=clamp(game.player.x-viewW*.38,0,Math.max(0,game.map.width-viewW));world.x=-camera*scale;mapScene.update(camera,game.time,false);
  }
  game.onTravelRequest=async target=>{
    if(transitioning)return;transitioning=true;pauseAfterLoad=false;ready=false;game.paused=true;clearInput();
    const view=await loadResources('正在进入'+MAPS[target].name+'…',async progress=>{
      const assets=await resources.map(target,progress);$('loadText').textContent='正在准备场景…';return prepareMap(target,assets);
    },true);
    if(view){game.completeTravel();showMap(view);await resources.activate(target);}else await resources.discard(target);
    transitioning=false;ready=true;finishLoading();pause(pauseAfterLoad||document.hidden);
  };
  const rect=heroFrames[0].frame;portraitCanvas=document.createElement('canvas');portraitCanvas.width=240;portraitCanvas.height=240;const pc=portraitCanvas.getContext('2d');const factor=205/rect.width;pc.imageSmoothingEnabled=true;pc.imageSmoothingQuality='high';pc.drawImage(heroAtlas.image,rect.x,rect.y,rect.width,rect.height,(240-rect.width*factor)/2,4,rect.width*factor,rect.height*factor);$('portrait').appendChild(portraitCanvas);
  const projGraphics=new P.Graphics();fxLayer.addChild(projGraphics);
  function resize(){const w=app.screen.width,h=app.screen.height;scale=h/720;viewH=720;viewW=w/scale;world.scale.set(scale);mapScene?.resize(viewW,scale);}
  const observer=new ResizeObserver(resize);observer.observe($('game'));showMap(prepareMap(game.map.id,initialAssets));await resources.activate(game.map.id);
  ready=true;finishLoading();updateUI();
  app.ticker.add(ticker=>{const dt=Math.min(ticker.deltaMS/1000,.04);game.update(dt,input);const p=game.player;
    camera=clamp(p.x-viewW*.38,0,Math.max(0,game.map.width-viewW));world.x=-camera*scale;mapScene.update(camera,game.time,game.nearPortal);
    heroAnimator.update(p,dt,game.paused);
    if(!p.dead&&p.invuln>0)hero.alpha=.72+Math.sin(game.time*18)*.18;
    nameplate.position.set(p.x,p.y-126);nameplate.visible=!p.dead;
    for(const m of game.monsters){
      let v=monsterViews.get(m);
      if(!v){const c=new P.Container(),s=new P.Sprite(monsterTexture);s.anchor.set(.5,1);c.addChild(s);const bar=new P.Graphics();c.addChild(bar);const label=textSprite('',11,0xf3f4f7);c.addChild(label);v={c,s,bar,label};monsterViews.set(m,v);world.addChildAt(c,Math.max(0,world.children.indexOf(hero)));}
      const appearance=monsterAppearance(m),candy=game.map.id==='candy';
      v.c.position.set(m.x,m.y);v.c.visible=appearance.visible;v.c.alpha=appearance.alpha;
      v.label.visible=v.bar.visible=!appearance.dying;
      if(appearance.dying){
        const frame=monsterDeaths[game.map.id][appearance.frame];
        v.s.texture=frame.texture;v.s.anchor.set(frame.anchorX,frame.anchorY);v.s.scale.set(frame.scale*(candy?m.dir:-m.dir),frame.scale);v.s.y=0;v.s.tint=0xffffff;
        continue;
      }
      if(candy){const i=Math.floor(game.time*9+m.phase)%candyFrames.length;v.s.texture=candyFrames[i];v.s.anchor.set(...CANDY_ART.monsterPivots[i]);v.s.scale.set(CANDY_ART.monsterScale*m.dir,CANDY_ART.monsterScale);v.s.y=0;}
      else{const hop=Math.sin(game.time*5+m.phase);v.s.texture=monsterTexture;v.s.anchor.set(.5,1);v.s.scale.set((66/monsterTexture.width)*(1+hop*.035)*-m.dir,(64/monsterTexture.height)*(1-hop*.04));v.s.y=-Math.max(0,hop)*5;}
      v.s.tint=m.hit?0xffb8ca:0xffffff;v.label.y=candy?-110:-78;v.bar.y=candy?-27:0;v.label.text=(candy?'绵糖兔':'芽芽')+' Lv.'+m.level;
      v.bar.clear();v.bar.roundRect(-25,-66,50,5,2).fill(0x242936).roundRect(-25,-66,50*Math.max(0,m.hp/m.maxHp),5,2).fill(0x7fc7ac);
    }
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
  $('mapPlayer').setAttribute('cx',8+p.x/game.map.width*234);$('mapPlayer').setAttribute('cy',64-(FLOOR-p.y)*.12);$('mapMonsters').innerHTML=game.monsters.filter(m=>!m.dead).map(m=>`<circle cx="${8+m.x/game.map.width*234}" cy="${64-(FLOOR-m.y)*.12}" r="1.9" fill="#9bba7e"/>`).join('');
  if(p.dead)$('respawnText').textContent=Math.max(1,Math.ceil(p.dead))+' 秒后在本地图重生';
}
function clearInput(){resetTouch();input.left=input.right=input.jump=input.down=input.touchJump=input.interact=false;input.skills.fill(false);document.querySelectorAll('.active').forEach(e=>e.classList.remove('active'));}
function pause(value){if(!ready||!game||$('panel').open)return;game.paused=value;clearInput();$('paused').classList.toggle('hidden',!value);$('pauseBtn').textContent=value?'▷':'Ⅱ';$('pauseBtn').setAttribute('aria-label',value?'继续游戏':'暂停游戏');}
function openPanel(type){if(!ready)return;wasPaused=game.paused;game.paused=true;clearInput();panelType=type;renderPanel();$('panel').showModal();}
function renderPanel(){if(!game)return;const stat=panelType==='stats',help=panelType==='help';$('panelTitle').textContent=help?'冒险指南':stat?'软棉棉 · 属性':'花之魔法';$('panelEyebrow').textContent=help?'HOW TO PLAY':stat?'CHARACTER · LV. '+game.level:'SKILLS & MAGIC';
  if(help){$('panelBody').innerHTML='<div class="help-list"><p><b>电脑操作</b><br><kbd>A</kbd> <kbd>D</kbd> 或方向键移动，<kbd>空格</kbd> 跳跃<br><kbd>J</kbd> 落花斩 · <kbd>K</kbd> 铃光弹 · <kbd>L</kbd> 花雨绽放<br><kbd>C</kbd> 属性 · <kbd>V</kbd> 技能 · <kbd>Esc</kbd> 暂停</p><p><b>手机操作</b><br>左下摇杆：左右移动，上推跳跃，下推从浮空平台落下。<br>右下三个技能按键，按住可连续施放，支持同时移动和攻击。</p><p><b>地图传送</b><br>花语原野最右侧通往绵糖梦境；梦境左侧可返回。靠近传送口，电脑按 ↑ / E，手机上推摇杆。<br>小地图上的粉色圆点标记传送口。</p><p><b>冒险与成长</b><br>击败芽芽史莱姆与绵糖兔获得经验。每级获得 5 属性点、3 技能点；人物、属性和技能等级最高 999。魔物随你的等级同步变强。<br>死亡后 3 秒在当前地图的重生点重生，保留全部养成进度。魔力自动恢复；升级和重生恢复生命。</p></div><p class="panel-foot">进度保存在当前浏览器。切换设备不会同步；清除浏览器数据会删除存档。横屏可获得更宽阔的视野。</p>';return;}
  const points=stat?game.statPoints:game.skillPoints;const rows=stat?[{name:'力量',icon:'♧',description:'每级提升 3 点攻击力'},{name:'体质',icon:'♡',description:'每级提升 14 点生命与防御'},{name:'灵性',icon:'✧',description:'每级提升 3 点魔力与恢复速度'}]:SKILLS;
  $('panelBody').innerHTML=`<div class="panel-summary">可用${stat?'属性':'技能'}点 <b>${points}</b> <span>· 每次升级获得 ${stat?5:3} 点</span></div>`+rows.map((s,i)=>{const val=(stat?game.stats:game.skillLevels)[i];return `<div class="upgrade-row"><span class="upgrade-icon">${s.icon}</span><div class="upgrade-info"><b>${s.name}</b><small>${s.description}</small>${!stat?`<small>伤害 ${game.damageFor(i)} · 魔力 ${s.cost} · ${s.cooldown} 秒</small>`:''}</div><span class="upgrade-value">${val}</span><button data-upgrade="${i}" aria-label="提升${s.name}" ${points<=0||val>=999?'disabled':''}>+</button></div>`;}).join('')+(stat?`<div class="derived"><div><span>攻击力</span><b>${game.attack}</b></div><div><span>防御力</span><b>${game.defense}</b></div><div><span>最大生命</span><b>${game.maxHp}</b></div><div><span>最大魔力</span><b>${game.maxMp}</b></div></div>`:'')+'<p class="panel-foot">等级上限 999 · 点击 + 分配成长点<br>打开面板时，冒险会自动暂停。</p>';
  document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>game.upgrade(stat?'stat':'skill',Number(b.dataset.upgrade)));
}
$('closePanel').onclick=()=>$('panel').close();$('panel').addEventListener('close',()=>{if(game)game.paused=wasPaused;clearInput();});$('panel').addEventListener('click',e=>{if(e.target===$('panel')){const r=$('panel').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('panel').close();}});
$('statsBtn').onclick=()=>openPanel('stats');$('skillsBtn').onclick=()=>openPanel('skills');$('helpBtn').onclick=()=>openPanel('help');$('pauseBtn').onclick=()=>pause(!game?.paused);$('resumeBtn').onclick=()=>pause(false);$('dismissWelcome').onclick=()=>$('welcome').classList.add('hidden');
$('soundBtn').onclick=()=>{soundEnabled=!soundEnabled;$('soundBtn').classList.toggle('on',soundEnabled);$('soundBtn').setAttribute('aria-label',soundEnabled?'关闭音效':'开启音效');tone(800,.15);};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('shell').requestFullscreen)await $('shell').requestFullscreen();else notify('此设备可使用浏览器的横屏模式');}catch{notify('此浏览器暂不支持全屏，试试横屏游玩');}};
const keys={KeyE:'interact',ArrowDown:'down',KeyS:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};
window.addEventListener('keydown',e=>{if(!ready)return;if($('panel').open)return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause(!game.paused);return;}if(['KeyC','KeyV'].includes(e.code)){if(!e.repeat)openPanel(e.code==='KeyC'?'stats':'skills');return;}if(keys[e.code]){e.preventDefault();input[keys[e.code]]=true;if(['ArrowUp','KeyW'].includes(e.code))input.interact=true;if(keys[e.code]!=='jump')$('welcome').classList.add('hidden');}const i=['KeyJ','KeyK','KeyL'].indexOf(e.code);if(i>=0){e.preventDefault();input.skills[i]=true;}});
window.addEventListener('keyup',e=>{if(keys[e.code])input[keys[e.code]]=false;if(['ArrowUp','KeyW'].includes(e.code))input.interact=false;const i=['KeyJ','KeyK','KeyL'].indexOf(e.code);if(i>=0)input.skills[i]=false;});
function bindHold(button,set){const pointers=new Set();button.addEventListener('pointerdown',e=>{e.preventDefault();if(!ready||game.paused||game.player.dead)return;button.setPointerCapture(e.pointerId);pointers.add(e.pointerId);set(true);button.classList.add('active');});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{pointers.delete(e.pointerId);if(!pointers.size){set(false);button.classList.remove('active');}});return ()=>{pointers.clear();set(false);button.classList.remove('active');};}
const resetStick=bindJoystick($('joystick'),input,()=>ready&&!game.paused&&!game.player.dead,()=>$('welcome').classList.add('hidden'));
const resetSkills=[...document.querySelectorAll('[data-skill]')].map(b=>bindHold(b,v=>{const i=Number(b.dataset.skill);input.skills[i]=v;if(v)game.useSkill(i);}));
resetTouch=()=>{resetStick();resetSkills.forEach(reset=>reset());};
const touchLayout=matchMedia('(any-pointer:coarse), (max-width:700px)');
function placeSkills(){clearInput();(touchLayout.matches?$('touchActions'):$('desktopSkills')).appendChild(document.querySelector('.skillbar'));}
touchLayout.addEventListener('change',placeSkills);window.addEventListener('resize',clearInput);placeSkills();
window.addEventListener('blur',()=>{if(transitioning)pauseAfterLoad=true;clearInput();if(ready&&!$('panel').open)pause(true);save();});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(transitioning)pauseAfterLoad=true;clearInput();if(ready&&!$('panel').open)pause(true);save();}});window.addEventListener('pagehide',save);
init().catch(error=>{console.error(error);$('loadText').textContent='原野暂时没有醒来：'+error.message;const b=document.createElement('button');b.className='primary';b.textContent='重新加载';b.onclick=()=>location.reload();$('loading').appendChild(b);});
