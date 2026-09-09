// Walk the generated character with two independent leg chains. Atlas cropping
// happens at runtime; the source PNG and its painted details stay intact.
export function footTarget(phase,hipX){
  const p=((phase%1)+1)%1;
  if(p<.5){const t=p*2;return {x:hipX+38-76*t,y:496-14*t**4,stance:true};}
  const t=(p-.5)*2;return {x:hipX-38+76*t,y:496-14*(1-t)-32*Math.sin(Math.PI*t),stance:false};
}
export function solveLeg(hip,foot,l1=65,l2=68){
  const dx=foot.x-hip.x,dy=foot.y-hip.y;
  const d=Math.max(.001,Math.min(Math.hypot(dx,dy),l1+l2-.001));
  const angle=Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
  const knee={x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1};
  return {knee,upperAngle:angle-Math.PI/2,lowerAngle:Math.atan2(foot.y-knee.y,foot.x-knee.x)-Math.PI/2};
}
export class WalkRig {
  constructor(P,source){
    this.root=new P.Container();this.root.pivot.set(210,496);this.root.scale.set(110/440);this.phase=0;
    const part=([x,y,x2,y2],px,py)=>{const s=new P.Sprite(new P.Texture({source,frame:new P.Rectangle(x,y,x2-x,y2-y)}));s.anchor.set((px-x)/(x2-x),(py-y)/(y2-y));return s;};
    this.legs=[
      {hip:{x:194,y:370},phase:.5,length:Math.hypot(14,65),restAngle:Math.atan2(65,-14),upper:part([150,369,214,443],194,370),lower:part([154,428,212,504],180,435)},
      {hip:{x:238,y:370},phase:0,length:65,restAngle:Math.PI/2,upper:part([214,369,267,443],238,370),lower:part([214,428,272,504],238,435)}
    ];
    for(const leg of this.legs)this.root.addChild(leg.upper,leg.lower);
    this.body=new P.Container();this.body.pivot.set(210,370);this.body.position.set(210,370);
    const torso=part([57,57,309,504],57,57);torso.position.set(57,57);
    // Keep the skirt and both hanging cape edges, hide only the old legs.
    const mask=new P.Graphics().poly([0,0,384,0,384,512,267,512,267,385,240,389,212,387,190,389,170,385,150,377,150,512,0,512]).fill(0xffffff);
    this.body.addChild(torso,mask);torso.mask=mask;this.root.addChild(this.body);this.update(0,265,1,false);
  }
  update(dt,speed,facing,paused){
    if(!paused)this.phase=(this.phase+dt*Math.abs(speed)/265/.56)%1;
    const bob=Math.sin(this.phase*Math.PI*4)*1.7;
    this.body.y=370+bob;this.body.rotation=Math.sin(this.phase*Math.PI*2)*.008;
    for(const leg of this.legs){const hip={x:leg.hip.x,y:leg.hip.y+bob};const foot=footTarget(this.phase+leg.phase,hip.x);const pose=solveLeg(hip,foot,leg.length,68);leg.upper.position.set(hip.x,hip.y);leg.upper.rotation=pose.upperAngle+Math.PI/2-leg.restAngle;leg.lower.position.set(pose.knee.x,pose.knee.y);leg.lower.rotation=pose.lowerAngle;}
    this.root.scale.set(110/440*facing,110/440);
  }
}
