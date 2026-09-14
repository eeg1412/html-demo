import {MONSTER_FADE_IN,MONSTER_DEATH_DURATION,clamp} from './engine.js?v=18';

// Model time drives both effects, so pausing also freezes fade/death playback.
export function monsterAppearance(monster){
  if(monster.dead)return {dying:true,visible:monster.deathElapsed<MONSTER_DEATH_DURATION,alpha:1,frame:Math.min(7,Math.floor(monster.deathElapsed/MONSTER_DEATH_DURATION*8))};
  const t=clamp(monster.spawnAge/MONSTER_FADE_IN,0,1);
  return {dying:false,visible:true,alpha:t*t*(3-2*t),frame:0};
}

export function deathFrames(P,texture,spec){
  return spec.frames.map(({rect,pivot})=>{
    const [x,y,w,h]=rect;
    return {texture:new P.Texture({source:texture.source,frame:new P.Rectangle(x,y,w,h)}),anchorX:(pivot[0]-x)/w,anchorY:(pivot[1]-y)/h,scale:spec.scale};
  });
}
