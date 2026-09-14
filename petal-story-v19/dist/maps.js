export const MAPS={
  meadow:{id:'meadow',name:'花语原野',subtitle:'宁静森林',english:'THE WHISPERING WOODS',poem:'风吹过，花正好',monster:'芽芽史莱姆',width:3200,floor:580,spawn:210,
    platforms:[{x:0,y:580,w:3200},{x:450,y:430,w:430},{x:940,y:300,w:430},{x:1950,y:420,w:390},{x:2390,y:280,w:390}],
    spawns:[[430,0],[1050,0],[1550,0],[2150,0],[2760,0],[620,1],[1180,2],[2140,3],[2560,4]],
    portal:{x:3060,target:'candy',arrival:320,label:'绵糖梦境'}},
  candy:{id:'candy',name:'绵糖梦境',subtitle:'棉花糖乐园',english:'THE COTTON CANDY DREAM',poem:'踩着糖霜，做一个软软的梦',monster:'绵糖兔',width:3600,floor:580,spawn:320,
    platforms:[{x:0,y:580,w:3600},{x:560,y:425,w:410},{x:1120,y:285,w:390},{x:1770,y:420,w:460},{x:2390,y:285,w:420},{x:2920,y:425,w:360}],
    spawns:[[730,0],[1290,0],[1900,0],[2520,0],[3240,0],[760,1],[1300,2],[1950,3],[2590,4],[3070,5]],
    portal:{x:140,target:'meadow',arrival:2860,label:'花语原野'}}
};
