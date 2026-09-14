// Grass and underground are painted together in a single dedicated texture.
// Never add an old floating-platform lip over this integrated transition.
export const GROUND_ART={scale:.5,contactY:355};
export function createGround(P,parent,texture,floor){
  const ground=new P.TilingSprite({texture,width:1,height:1});
  const {scale:artScale,contactY}=GROUND_ART;
  ground.tileScale.set(artScale);ground.y=floor-contactY*artScale;
  parent.addChild(ground);
  return {ground,resize(width,viewHeight){
    ground.width=width;ground.height=viewHeight-ground.y+64;
  }};
}
