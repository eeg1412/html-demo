// PixiJS 8: https://pixijs.download/v8.17.1/docs/scene.AnimatedSprite.html
export function animationState(player){
  if(player.dead)return 'dead';
  if(player.action>0)return player.actionKind;
  if(!player.grounded)return 'jump';
  return Math.abs(player.vx)>1?'walk':'idle';
}

export class HeroAnimator {
  constructor(PIXI,clips,walker=null){
    this.clips=clips;this.state='';this.serial=-1;
    this.root=new PIXI.Container();this.walker=walker;if(walker)this.root.addChild(walker.root);
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
    if(!paused&&this.sprite.playing)this.sprite.update({deltaTime:dt*60});
    const clip=this.clips[this.state];const anchor=clip.anchors?.[this.sprite.currentFrame];
    if(anchor)this.sprite.anchor.set(anchor.x,anchor.y);
    this.sprite.scale.set(clip.scale*player.facing,clip.scale);
    this.root.position.set(player.x,player.y);this.sprite.position.set(0,0);
    const walking=this.state==='walk'&&this.walker;
    this.sprite.visible=!walking;
    if(this.walker){this.walker.root.visible=!!walking;if(walking)this.walker.update(dt,player.vx,player.facing,paused);}
    // Frame art carries the movement. Only idle has a small breathing motion.
    if(this.state==='idle'&&!paused)this.breath=(this.breath||0)+dt;
    if(this.state==='idle')this.sprite.y+=Math.sin((this.breath||0)*3)*.9;
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

export function createHeroClips(base,walk,slash,magic){
  const originalScale=110/base[0].height;
  const sequence=(atlas,start,count,times,loop=false)=>({
    ...timedClip(atlas.frames.slice(start,start+count),times,110/atlas.spec.bodyHeight,loop),
    anchors:atlas.anchors?.slice(start,start+count),
    anchorX:atlas.spec.pivotX===undefined?.5:atlas.spec.pivotX/atlas.width,
    anchorY:atlas.spec.baseline/atlas.height
  });
  return {
    idle:sequence(magic,0,1,[1000],true),
    walk:sequence(magic,0,1,[1000],true),
    jump:timedClip([base[3]],[1000],originalScale),
    slash:sequence(slash,0,6,[60,80,60,70,100,110]),
    bolt:sequence(magic,0,4,[140,140,170,150]),
    rain:sequence(magic,4,4,[220,220,260,180]),
    hurt:timedClip([base[6]],[250],originalScale),
    dead:timedClip([base[7]],[3000],originalScale)
  };
}
