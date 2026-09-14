// Hand-reviewed source pivots: first four poses touch the same ground plane.
// Later particles share that plane and disperse upward as painted in the atlas.
const frames=(xs,ys)=>Array.from({length:8},(_,i)=>{
  const x=i%4*384,y=Math.floor(i/4)*512;
  return {rect:[x,y,384,512],pivot:[x+xs[i],y+ys[i]]};
});
export const MONSTER_DEATH_ART={
  meadow:{url:'assets/slime-death-v18.webp',scale:.185,frames:frames([216,204,196,184,200,200,192,192],[467,474,487,491,491,491,491,491])},
  candy:{url:'assets/candy-death-v18.webp',scale:.24,frames:frames([222,215,188,178,205,205,192,192],[444,475,482,480,480,480,480,480])}
};
