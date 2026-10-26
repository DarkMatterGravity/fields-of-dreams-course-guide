/* Shared, deterministic label placement for the sign and editable SVG export. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.CourseLabelPlacement=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const RADIUS=10.5,OUTLINE=.8,ROUTE_WIDTH=2.9;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function pointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return distance(p,{x:a.x+t*dx,y:a.y+t*dy});}
 function cross(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
 function intersects(a,b,c,d){const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);return u*v<0&&w*z<0;}
 function segmentDistance(a,b,c,d){return intersects(a,b,c,d)?0:Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b));}
 function leaderFor(center,anchor){
  const length=distance(center,anchor),dx=(anchor.x-center.x)/length,dy=(anchor.y-center.y)/length;
  const teeEdge=5.8/Math.max(Math.abs(dx),Math.abs(dy));
  return {start:{x:center.x+dx*(RADIUS+OUTLINE),y:center.y+dy*(RADIUS+OUTLINE)},end:{x:anchor.x-dx*teeEdge,y:anchor.y-dy*teeEdge}};
 }
 function place(holes){
  const segments=[],markerMap=new Map(),anchors=holes.map(h=>({id:h.id,...h.anchor}));
  for(const hole of holes){
   for(const path of hole.routes)for(let i=1;i<path.length;i++)segments.push({id:hole.id,a:path[i-1],b:path[i]});
   for(const m of hole.markers)markerMap.set(m.id,m);
  }
  const markers=[...markerMap.values()],circleClear=RADIUS+OUTLINE;
  const routeLimit=circleClear+ROUTE_WIDTH/2+3;
  const labelLimit=2*circleClear+4;
  const radii=[25,29,34,40,47,55,65,77,92];
  // Left, upper-left and above are preferred when equally clear.
  const angles=[180,225,270,135,315,90,0,45,202.5,247.5,292.5,157.5,337.5,112.5,22.5,67.5];
  // Art-directed sides in the displayed map: right, north, southwest, south.
  const directedAngles={'12':[0],'10':[270],'5':[135,157.5,112.5],'3':[90]};
  const entries=holes.map(hole=>{
   const candidates=[];
   const holeAngles=directedAngles[hole.id]||angles;
   for(const radius of radii)for(let ai=0;ai<holeAngles.length;ai++){
    const theta=holeAngles[ai]*Math.PI/180,p={x:hole.anchor.x+radius*Math.cos(theta),y:hole.anchor.y+radius*Math.sin(theta)};
    if(p.x<circleClear+4||p.y<circleClear+4||p.x>1152-circleClear-4||p.y>1120-circleClear-4)continue;
    const routeGap=Math.min(...segments.map(s=>pointSegment(p,s.a,s.b)));
    if(routeGap<routeLimit)continue;
    if(markers.some(m=>distance(p,m)<circleClear+m.radius+3))continue;
    const nearestOther=Math.min(...anchors.filter(a=>a.id!==hole.id).map(a=>distance(p,a)));
    const leader=leaderFor(p,hole.anchor);
    // A connector must not cross any fairway away from its own tee.
    const cleanLeader=segments.every(s=>{
     if(s.id===hole.id&&pointSegment(hole.anchor,s.a,s.b)<1)return true;
     if(pointSegment(hole.anchor,s.a,s.b)<8)return true;
     return segmentDistance(leader.start,leader.end,s.a,s.b)>2.7;
    });
    const showLeader=!directedAngles[hole.id]&&(radius>30||nearestOther<radius+12);
    if(showLeader&&!cleanLeader)continue;
    const association=Math.max(0,radius+10-nearestOther)*1.5;
    candidates.push({...p,anchor:hole.anchor,radius:RADIUS,routeGap,showLeader,leader,
     score:(radius-25)*.8+ai*.25+association+(showLeader?2:0)});
   }
   candidates.sort((a,b)=>a.score-b.score);
   if(!candidates.length)throw Error('No clear label position for hole '+hole.id);
   return {id:hole.id,candidates};
  }).sort((a,b)=>a.candidates.length-b.candidates.length||Number(a.id)-Number(b.id));
  const chosen=new Map();let attempts=0;
  function compatible(p,q){
   if(distance(p,q)<labelLimit)return false;
   if(p.showLeader&&pointSegment(q,p.leader.start,p.leader.end)<circleClear+2)return false;
   if(q.showLeader&&pointSegment(p,q.leader.start,q.leader.end)<circleClear+2)return false;
   if(p.showLeader&&q.showLeader&&segmentDistance(p.leader.start,p.leader.end,q.leader.start,q.leader.end)<2)return false;
   return true;
  }
  function search(i){
   if(i===entries.length)return true;
   if(++attempts>150000)return false;
   const entry=entries[i];
   for(const p of entry.candidates){
    if([...chosen.values()].some(q=>!compatible(p,q)))continue;
    chosen.set(entry.id,p);if(search(i+1))return true;chosen.delete(entry.id);
   }
   return false;
  }
  if(!search(0))throw Error('Could not place all hole labels without collisions');
  const labels=Object.fromEntries(chosen);
  return {labels,report:{holes:holes.length,minimumCenterToRoute:Math.min(...[...chosen.values()].map(p=>p.routeGap)),requiredCenterToRoute:routeLimit,minimumLabelSeparation:Math.min(...[...chosen.values()].flatMap((p,i,a)=>a.slice(i+1).map(q=>distance(p,q)))),requiredLabelSeparation:labelLimit,leaders:[...chosen.values()].filter(p=>p.showLeader).length,attempts}};
 }
 return {place,pointSegment,RADIUS};
});
