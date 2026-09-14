// PixiJS 8: https://pixijs.download/v8.17.1/docs/scene.AnimatedSprite.html
export function animationState(player){
  if(player.dead)return 'dead';
  if(player.action>0)return player.actionKind;
  if(!player.grounded)return 'jump';
  return Math.abs(player.vx)>1?'walk':'idle';
}

export class HeroAnimator {
  constructor(PIXI,clips){
    this.clips=clips;this.state='';this.serial=-1;
    this.root=new PIXI.Container();
    this.sprite=new PIXI.AnimatedSprite({textures:clips.idle.frames,autoUpdate:false,autoPlay:false});
    this.root.addChild(this.sprite);
    this.sprite.anchor.set(.5,1);this.sprite.roundPixels=false;
  }
  update(player,dt,paused){
    const next=animationState(player);
    const serial=player.action>0?player.actionSerial:-1;
    if(next!==this.state||serial!==this.serial){
      this.state=next;this.serial=serial;
      const clip=this.clips[next];this.sprite.textures=clip.frames;
      this.sprite.anchor.set(clip.anchorX??.5,clip.anchorY??1);
      this.sprite.loop=clip.loop;this.sprite.animationSpeed=1;
      this.sprite.gotoAndPlay(0);
    }
    if(!paused&&next==='jump'){
      // Match ascent, apex and fall to physics, so long falls never replay takeoff.
      this.sprite.gotoAndStop(player.vy<-280?0:player.vy<180?1:player.vy<550?2:3);
    }else if(!paused&&this.sprite.playing)this.sprite.update({deltaTime:dt*60});
    const clip=this.clips[this.state];const anchor=clip.anchors?.[this.sprite.currentFrame];
    if(anchor)this.sprite.anchor.set(anchor.x,anchor.y);
    this.sprite.scale.set(clip.scale*player.facing,clip.scale);
    this.root.position.set(player.x,player.y);this.sprite.position.set(0,0);
    this.root.alpha=player.dead?Math.max(.15,player.dead/3):1;
  }
}

export function smoothSource(source){
  // Linear min/mag/mipmap filtering plus generated mip levels suppresses
  // undersampling of fine hair and lace when 400px art is drawn at ~110px.
  source.scaleMode='linear';
  source.autoGenerateMipmaps=true;
  source.style.mipmapFilter='linear';
  source.update();
}

export function timedClip(textures,times,scale,loop=false){
  return {frames:textures.map((texture,i)=>({texture,time:times[i]})),scale,loop};
}

export function createHeroClips(base,walk,slash,bolt,rain,reaction,idle){
  const originalScale=110/base[0].height;
  const sequence=(atlas,times,loop=false,start=0)=>({
    ...timedClip(atlas.frames.slice(start,start+times.length),times,110/atlas.spec.bodyHeight,loop),
    anchors:atlas.anchors.slice(start,start+times.length)
  });
  return {
    idle:sequence(idle,[1000],true),
    walk:sequence(walk,Array(8).fill(45),true),
    jump:sequence(reaction,[100,100,100,100]),
    slash:sequence(slash,[40,50,50,60,70,70,70,70]),
    bolt:sequence(bolt,[70,70,70,70,80,80,80,80]),
    rain:sequence(rain,Array(8).fill(110)),
    hurt:sequence(reaction,[60,70,60,60],false,4),
    dead:timedClip([base[7]],[3000],originalScale)
  };
}
