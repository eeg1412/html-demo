export const CAP = 999;
export const WORLD = 3200;
export const FLOOR = 580;
export const PLATFORMS = [{x:0,y:FLOOR,w:WORLD},{x:450,y:430,w:430},{x:940,y:300,w:430},{x:1950,y:420,w:390},{x:2390,y:280,w:390}];
export const SKILLS = [
  {name:'落花斩',icon:'❀',cooldown:.48,cost:0,mult:1.15,range:155,animation:'slash',duration:.48,impact:.20,description:'向前挥出花刃 · 近身群攻'},
  {name:'铃光弹',icon:'✦',cooldown:1.6,cost:14,mult:2.1,range:650,animation:'bolt',duration:.60,impact:.28,description:'发射贯穿铃光 · 远程攻击'},
  {name:'花雨绽放',icon:'✺',cooldown:5.5,cost:32,mult:3.5,range:300,animation:'rain',duration:.88,impact:.44,description:'召唤花雨 · 周围范围攻击'}
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const xpNeeded=level=>Math.floor(40*Math.pow(level,1.17));
export const monsterStats=level=>({maxHp:Math.round(50+level*17+Math.pow(level,1.28)*3),attack:Math.round(7+level*2.4),xp:Math.round(16*Math.pow(level,1.12))});
const safeInt=(v,d,min=0,max=CAP)=>Number.isFinite(v)?clamp(Math.floor(v),min,max):d;
export class GameModel {
  constructor(save={},emit=()=>{}) {
    this.emit=emit; this.level=safeInt(save.level,1,1);this.xp=safeInt(save.xp,0,0,xpNeeded(this.level)-1);
    this.stats=['power','vitality','spirit'].map((k,i)=>safeInt(save.stats?.[i],1,1));
    this.skillLevels=[0,1,2].map(i=>safeInt(save.skillLevels?.[i],1,1));
    const statSpent=this.stats.reduce((a,b)=>a+b-1,0),skillSpent=this.skillLevels.reduce((a,b)=>a+b-1,0);
    this.statPoints=Math.max(0,(this.level-1)*5-statSpent);this.skillPoints=Math.max(0,(this.level-1)*3-skillSpent);
    this.kills=safeInt(save.kills,0,0,Number.MAX_SAFE_INTEGER);this.time=0;this.active=false;this.paused=false;
    this.player={x:210,y:FLOOR,vx:0,vy:0,facing:1,grounded:true,hp:this.maxHp,mp:this.maxMp,invuln:2,action:0,actionKind:'idle',actionSerial:0,frame:0,dead:0};this.pendingCast=null;
    this.cooldowns=[0,0,0];this.projectiles=[];this.monsters=[];this.nextId=1;
    for(const [x,p] of [[430,0],[1050,0],[1550,0],[2150,0],[2760,0],[620,1],[1180,2],[2140,3],[2560,4]])this.monsters.push(this.makeMonster(x,p));
  }
  get maxHp(){return 120+this.level*10+this.stats[1]*14;}
  get maxMp(){return 65+this.level*2+this.stats[2]*3;}
  get attack(){return 14+this.level*4+this.stats[0]*3;}
  get defense(){return Math.floor(this.level*.65+this.stats[1]*.9);}
  get regen(){return 7+this.stats[2]*.08;}
  damageFor(i){return Math.round(this.attack*SKILLS[i].mult*(1+(this.skillLevels[i]-1)*.035));}
  makeMonster(x,platform){const s=monsterStats(this.level);return {id:this.nextId++,x,y:PLATFORMS[platform].y,home:x,platform,hp:s.maxHp,maxHp:s.maxHp,level:this.level,dir:-1,hit:0,dead:0,phase:x*.013};}
  serialize(){return {version:1,level:this.level,xp:this.xp,stats:this.stats,skillLevels:this.skillLevels,kills:this.kills};}
  upgrade(type,i){if(!Number.isInteger(i)||i<0||i>2)return false;const values=type==='stat'?this.stats:this.skillLevels;const key=type==='stat'?'statPoints':'skillPoints';if(this[key]<=0||values[i]>=CAP)return false;const hp=this.maxHp,mp=this.maxMp;values[i]++;this[key]--;this.player.hp+=this.maxHp-hp;this.player.mp+=this.maxMp-mp;this.emit('upgrade',{type,i});return true;}
  gainXP(amount){if(this.level>=CAP)return;this.xp+=amount;let gained=0;while(this.level<CAP&&this.xp>=xpNeeded(this.level)){this.xp-=xpNeeded(this.level);this.level++;this.statPoints+=5;this.skillPoints+=3;gained++;}if(this.level===CAP)this.xp=0;if(gained){this.player.hp=this.maxHp;this.player.mp=this.maxMp;for(const m of this.monsters){const ratio=m.hp/m.maxHp;const s=monsterStats(this.level);m.level=this.level;m.maxHp=s.maxHp;m.hp=Math.max(1,Math.round(s.maxHp*ratio));}this.emit('level',{level:this.level,gained});}}
  hurtMonster(m,damage){if(m.dead)return;m.hp=Math.max(0,m.hp-damage);m.hit=.2;this.emit('hit',{x:m.x,y:m.y-60,damage});if(m.hp<=0){m.dead=4.5;this.kills++;this.emit('kill',{x:m.x,y:m.y-30,xp:monsterStats(this.level).xp});this.gainXP(monsterStats(this.level).xp);}}
  useSkill(i){const p=this.player,s=SKILLS[i];if(!s||this.paused||p.dead||p.action>0||this.cooldowns[i]>0)return false;this.active=true;if(p.mp<s.cost){this.emit('mana',{});return false;}p.mp-=s.cost;this.cooldowns[i]=s.cooldown;p.action=s.duration;p.actionKind=s.animation;p.actionSerial++;p.frame=i===0?4:5;this.pendingCast={i,delay:s.impact,facing:p.facing};this.emit('cast',{i,x:p.x,y:p.y-55,facing:p.facing});return true;}
  releaseSkill(i,facing){const p=this.player,s=SKILLS[i];if(p.dead)return;this.emit('skill',{i,x:p.x,y:p.y-55,facing});const damage=this.damageFor(i);
    if(i===1)this.projectiles.push({x:p.x+facing*35,y:p.y-50,dir:facing,life:.95,hits:new Set(),damage});
    else for(const m of this.monsters){const dx=m.x-p.x,dy=Math.abs(m.y-p.y);if(!m.dead&&Math.abs(dx)<s.range&&dy<(i===2?240:92)&&(i===2||dx*facing>-30))this.hurtMonster(m,damage);}
  }
  hurtPlayer(damage){const p=this.player;if(p.dead||p.invuln>0)return;p.hp=Math.max(0,p.hp-damage);p.invuln=1;p.action=.25;p.actionKind='hurt';p.actionSerial++;this.pendingCast=null;p.frame=6;this.emit('hurt',{damage,x:p.x,y:p.y-110});if(p.hp===0){p.dead=3;p.frame=7;p.action=0;p.vx=0;this.emit('death',{x:p.x,y:p.y-55});}}
  respawn(){const p=this.player;Object.assign(p,{x:210,y:FLOOR,vx:0,vy:0,hp:this.maxHp,mp:this.maxMp,dead:0,invuln:3,grounded:true,action:0,actionKind:'idle',frame:0});this.pendingCast=null;this.cooldowns=[0,0,0];this.projectiles=[];this.emit('respawn',{x:p.x,y:p.y-55});}
  update(dt,input={}) {
    if(this.paused)return;dt=clamp(dt,0,.04);this.time+=dt;const p=this.player;
    if(p.dead){p.dead-=dt;if(p.dead<=0)this.respawn();return;}
    p.invuln=Math.max(0,p.invuln-dt);p.action=Math.max(0,p.action-dt);this.cooldowns=this.cooldowns.map(c=>Math.max(0,c-dt));p.mp=Math.min(this.maxMp,p.mp+this.regen*dt);
    const direction=(input.right?1:0)-(input.left?1:0);if(direction||input.jump)this.active=true;
    p.vx=direction*265*(p.action>0?.25:1);if(direction&&p.action===0)p.facing=direction;
    if(input.jump&&p.grounded){p.vy=-760;p.grounded=false;this.emit('jump',{});}
    const prevY=p.y;p.vy+=1550*dt;p.x=clamp(p.x+p.vx*dt,45,WORLD-45);p.y+=p.vy*dt;p.grounded=false;
    if(p.vy>=0)for(const platform of PLATFORMS){if(p.x+17>platform.x&&p.x-17<platform.x+platform.w&&prevY<=platform.y+1&&p.y>=platform.y){p.y=platform.y;p.vy=0;p.grounded=true;break;}}
    if(p.y>FLOOR+200){this.hurtPlayer(this.maxHp);}
    if(!p.action)p.frame=!p.grounded?3:direction?(Math.floor(this.time*9)%2+1):0;
    if(this.pendingCast){this.pendingCast.delay-=dt;if(this.pendingCast.delay<=0){const cast=this.pendingCast;this.pendingCast=null;this.releaseSkill(cast.i,cast.facing);}}
    for(let i=0;i<3;i++)if(input.skills?.[i])this.useSkill(i);
    for(const m of this.monsters){if(m.dead){m.dead-=dt;if(m.dead<=0){const replacement=this.makeMonster(m.home,m.platform);Object.assign(m,replacement);this.emit('spawn',{x:m.x,y:m.y});}continue;}
      m.hit=Math.max(0,m.hit-dt);const plat=PLATFORMS[m.platform],near=this.active&&Math.abs(p.x-m.x)<420&&Math.abs(p.y-m.y)<80;
      if(near)m.dir=Math.sign(p.x-m.x)||m.dir;else if(m.x>m.home+100)m.dir=-1;else if(m.x<m.home-100)m.dir=1;
      const speed=near?72+Math.min(this.level*.12,45):28;m.x=clamp(m.x+m.dir*speed*dt,plat.x+30,plat.x+plat.w-30);
      if(this.active&&Math.abs(p.x-m.x)<40&&Math.abs(p.y-m.y)<58)this.hurtPlayer(Math.max(3,monsterStats(this.level).attack-this.defense));
    }
    for(const projectile of this.projectiles){const prevX=projectile.x;projectile.x+=projectile.dir*690*dt;projectile.life-=dt;
      for(const m of this.monsters)if(!m.dead&&!projectile.hits.has(m.id)&&Math.abs(m.y-40-projectile.y)<65&&m.x>=Math.min(prevX,projectile.x)-35&&m.x<=Math.max(prevX,projectile.x)+35){projectile.hits.add(m.id);this.hurtMonster(m,projectile.damage);}}
    this.projectiles=this.projectiles.filter(q=>q.life>0);
  }
}
