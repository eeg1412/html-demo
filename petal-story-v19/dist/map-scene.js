import {ParallaxScene,farPlacement,DEPTH} from './parallax.js?v=9';
import {SCENERY_ART} from './scenery-art.js?v=7';
import {createGround} from './ground.js?v=11';
import {CANDY_ART} from './candy-art.js?v=16';

const textureFrame=(P,texture,[x,y,w,h])=>new P.Texture({source:texture.source,frame:new P.Rectangle(x,y,w,h)});
export const CANDY_URLS=['assets/candy-far-v16.webp','assets/candy-scenery-v16.webp','assets/candy-monster-v15.webp','assets/candy-ground-v15.webp','assets/candy-objects-v15.webp'];
export class MapScene{
  constructor(P,map,assets,objects,label){
    this.P=P;this.map=map;this.terrain=new P.Container();this.candy=map.id==='candy';
    const sprite=(texture,x,y,w,h)=>{const s=new P.Sprite(texture);s.position.set(x,y);s.width=w;s.height=h;this.terrain.addChild(s);return s;};
    if(this.candy){
      this.back=new P.Container();this.front=new P.Container();this.sky=new P.Sprite(assets[CANDY_URLS[0]]);this.back.addChild(this.sky);this.layers=[];
      const sweets=new P.Container(),groundMask=new P.Graphics();this.back.addChild(sweets,groundMask);sweets.mask=groundMask;this.groundMask=groundMask;
      const sweetTextures=CANDY_ART.sweets.map(r=>textureFrame(P,assets[CANDY_URLS[1]],r));
      // Vary spacing, scale, and depth. All artwork stays at full opacity.
      for(const [speed,items] of [[DEPTH.rear,[[80,210,2],[620,260,1],[1210,230,0],[1910,255,2],[2560,220,1],[3260,260,0]]],[DEPTH.mid,[[350,350,0],[1190,410,1],[2180,330,2],[3050,390,0],[3920,355,1]]]]){
        const nodes=items.map(([x,h,kind],i)=>{const s=new P.Sprite(sweetTextures[kind]);s.anchor.set(.5,1);s.scale.set(h/s.texture.height);s.position.set(x,604+(i%3)*8);sweets.addChild(s);return {s,x};});this.layers.push({speed,nodes});
      }
      const hanging=CANDY_ART.hanging.map(r=>textureFrame(P,assets[CANDY_URLS[1]],r));
      const nodes=[-30,1130,2490,3760,4850].map((x,i)=>{const s=new P.Sprite(hanging[i%hanging.length]);s.anchor.set(.5,0);s.width=i%2?310:205;s.scale.y=s.scale.x;s.position.set(x,i%2?-65:-90);this.front.addChild(s);return {s,x};});this.layers.push({speed:DEPTH.foreground,nodes});
      const texture=assets[CANDY_URLS[3]],spec=CANDY_ART.ground;
      // Reflect alternate complete tiles: each seam meets the very same source
      // edge, including the frosting contour. Never splice a separate soil strip.
      const ground=new P.Container(),groundTiles=[];this.terrain.addChild(ground);const tileWidth=texture.width*spec.scale;
      this.ground={resize(w){const count=Math.ceil(w/tileWidth);while(groundTiles.length<count){const i=groundTiles.length,s=new P.Sprite(texture);s.scale.set(i%2?-spec.scale:spec.scale,spec.scale);s.position.set((i+(i%2))*tileWidth,map.floor-spec.contactY*spec.scale);ground.addChild(s);groundTiles.push(s);}}};
      const tiles=assets[CANDY_URLS[4]],platform=textureFrame(P,tiles,CANDY_ART.platform);
      for(const p of map.platforms.slice(1)){const h=p.w*platform.height/platform.width;sprite(platform,p.x,p.y-CANDY_ART.platformContact*h/platform.height,p.w,h);}
      const checkpoint=textureFrame(P,tiles,CANDY_ART.checkpoint);const w=95,h=w*checkpoint.height/checkpoint.width;sprite(checkpoint,map.spawn-120,map.floor-h+3,w,h);
      const name=label('糖铃石',13,0xf3f4f7);name.position.set(map.spawn-70,map.floor-h-15);this.terrain.addChild(name);
    }else{
      this.forest=new ParallaxScene(P,{far:assets['assets/forest-far-v7.webp'],trees:assets['assets/trees-v6.webp'],foreground:assets['assets/foliage-v6.webp']},SCENERY_ART);
      this.back=this.forest.back;this.front=this.forest.front;
      this.ground=createGround(P,this.terrain,assets['assets/ground-v11.webp'],map.floor);
      for(const p of map.platforms.slice(1))sprite(objects[1],p.x,p.y-96*45/220,p.w,96);
      sprite(objects[2],125,map.floor-130,130,145);
      const name=label('花铃石',13,0xf3f4f7);name.position.set(190,map.floor-140);this.terrain.addChild(name);
      for(const x of [35,890,1780,2440])sprite(objects[3],x,map.floor-50,110,62);
    }
    const portal=textureFrame(P,assets[CANDY_URLS[4]],CANDY_ART.portal);
    this.portal=sprite(portal,map.portal.x-63,map.floor-155,126,155);
    this.glow=new P.Graphics();this.terrain.addChild(this.glow);
    const title=label(map.portal.label,16,0xf3f4f7,0x191c25);title.position.set(map.portal.x,map.floor-183);this.terrain.addChild(title);
    this.prompt=label('↑ / E · 传送',13,0xf3f4f7,0x191c25);this.prompt.position.set(map.portal.x,map.floor-164);this.terrain.addChild(this.prompt);
  }
  resize(viewWidth,scale){this.viewWidth=viewWidth;this.scale=scale;this.back.scale.set(scale);this.front.scale.set(scale);this.ground.resize(Math.max(this.map.width,viewWidth),720);this.groundMask?.clear().rect(0,0,viewWidth,this.map.floor).fill(0xffffff);this.forest?.resize(viewWidth,scale,this.map.width);}
  update(camera,time,near){
    if(this.forest)this.forest.update(camera);
    else{const t=this.sky.texture,p=farPlacement(t.width,t.height,this.viewWidth,this.map.width,camera);this.sky.scale.set(p.scale);this.sky.position.set(p.x,p.y);for(const layer of this.layers)for(const {s,x} of layer.nodes){s.x=x-camera*layer.speed;s.visible=s.x+s.width/2>=0&&s.x-s.width/2<=this.viewWidth;}}
    this.glow.clear();for(let i=0;i<8;i++){const a=time*.7+i*Math.PI/4;this.glow.circle(this.map.portal.x+Math.sin(a)*45,this.map.floor-75+Math.cos(a)*60,2+Math.sin(time*2+i)).fill({color:0xffe3f4,alpha:.8});}
    this.prompt.text=near?'↑ / E · 上推传送':'传送口';
  }
  destroy(){this.back.destroy({children:true});this.front.destroy({children:true});this.terrain.destroy({children:true});}
}
