export function stickDirection(dx,dy,radius){
  const length=Math.hypot(dx,dy),factor=length>radius?radius/length:1;
  const x=dx*factor,y=dy*factor;
  return {x,y,left:x<-.26*radius,right:x>.26*radius,up:y<-.58*radius,down:y>.58*radius};
}

export function bindJoystick(element,input,enabled,onMove){
  const knob=element.querySelector('.joystick-knob');
  let pointer=null,up=false;
  const reset=()=>{
    const id=pointer;pointer=null;up=false;
    input.left=input.right=input.down=input.touchJump=false;
    knob.style.transform='translate(0px,0px)';element.classList.remove('active');
    if(id!==null&&element.hasPointerCapture(id))element.releasePointerCapture(id);
  };
  const move=e=>{
    if(e.pointerId!==pointer)return;
    if(!enabled()){reset();return;}
    e.preventDefault();const box=element.getBoundingClientRect();
    const v=stickDirection(e.clientX-box.left-box.width/2,e.clientY-box.top-box.height/2,box.width*.31);
    input.left=v.left;input.right=v.right;input.down=v.down;
    if(v.up&&!up)input.touchJump=true;
    up=v.up;knob.style.transform=`translate(${v.x}px,${v.y}px)`;
    if(v.left||v.right||v.up||v.down)onMove();
  };
  element.addEventListener('pointerdown',e=>{
    e.preventDefault();if(pointer!==null||!enabled())return;
    pointer=e.pointerId;element.setPointerCapture(pointer);element.classList.add('active');move(e);
  });
  element.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,e=>{if(e.pointerId===pointer)reset();});
  element.addEventListener('contextmenu',e=>e.preventDefault());
  return reset;
}
