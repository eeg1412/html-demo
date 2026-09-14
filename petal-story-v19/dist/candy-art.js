// Bounds retain generated transparent edges; no matte removal or alpha edits.
export const CANDY_ART={
  sweets:[[14,4,483,505],[540,5,457,501],[1038,67,476,442]],
  hanging:[[0,512,512,512],[517,548,507,358]],
  monster:Array.from({length:8},(_,i)=>[(i%4)*384,Math.floor(i/4)*512,384,512]),
  monsterPivots:Array.from({length:8},(_,i)=>[.515,(i<4?447:426)/512]),monsterScale:.24,
  ground:{scale:.5,contactY:325},
  platform:[12,20,1516,368],platformContact:145,
  portal:[63,388,606,586],checkpoint:[728,514,784,415]
};
