import {REAR_TREE_LAYOUT,MID_TREE_LAYOUT,FOLIAGE_LAYOUT} from './scenery-layout.js?v=9';

// Camera distances use the same 720-high world coordinates as the terrain.
export const DEPTH = Object.freeze({far:.08,rear:.27,mid:.55,world:1,foreground:1.24});

export function farPlacement(textureWidth,textureHeight,viewWidth,worldWidth,camera){
  const travel=Math.max(0,worldWidth-viewWidth)*DEPTH.far;
  const scale=Math.max(720/textureHeight,(viewWidth+travel)/textureWidth);
  const width=textureWidth*scale,height=textureHeight*scale;
  return {scale,x:-(width-viewWidth-travel)/2-camera*DEPTH.far,y:(720-height)*.48,width,height};
}

export class ParallaxScene {
  constructor(P,textures,art){
    this.P=P;this.textures=textures;
    this.back=new P.Container();this.front=new P.Container();
    this.sky=new P.Sprite(textures.far);this.back.addChild(this.sky);
    const frames=(texture,rects)=>rects.map(([x,y,w,h])=>new P.Texture({source:texture.source,frame:new P.Rectangle(x,y,w,h)}));
    const trees=frames(textures.trees,art.trees);
    this.rear=new P.Container();this.mid=new P.Container();
    this.back.addChild(this.rear,this.mid);
    this.rearSprites=this.populate(this.rear,trees,REAR_TREE_LAYOUT);
    this.midSprites=this.populate(this.mid,trees,MID_TREE_LAYOUT);
    this.frontSprites=this.populate(this.front,frames(textures.foreground,art.foliage),FOLIAGE_LAYOUT);
  }

  populate(container,textures,layout){
    return layout.map(item=>{
      const sprite=new this.P.Sprite(textures[item.kind]);
      sprite.anchor.set(.5,1);sprite.scale.set(item.height/sprite.texture.height);
      sprite.roundPixels=false;
      sprite.position.set(item.x,item.y);container.addChild(sprite);return sprite;
    });
  }

  resize(viewWidth,scale,worldWidth){
    this.viewWidth=viewWidth;this.worldWidth=worldWidth;
    this.back.scale.set(scale);this.front.scale.set(scale);
    this.update(Math.max(0,Math.min(this.camera??0,Math.max(0,worldWidth-viewWidth))));
  }

  move(sprites,layout,camera,speed){
    sprites.forEach((sprite,i)=>{
      sprite.x=layout[i].x-camera*speed;
      sprite.visible=sprite.x+sprite.width/2>=0&&sprite.x-sprite.width/2<=this.viewWidth;
    });
  }

  update(camera){
    this.camera=camera;
    const t=this.textures.far,p=farPlacement(t.width,t.height,this.viewWidth,this.worldWidth,camera);
    this.sky.scale.set(p.scale);this.sky.position.set(p.x,p.y);
    this.move(this.rearSprites,REAR_TREE_LAYOUT,camera,DEPTH.rear);
    this.move(this.midSprites,MID_TREE_LAYOUT,camera,DEPTH.mid);
    this.move(this.frontSprites,FOLIAGE_LAYOUT,camera,DEPTH.foreground);
  }
}
