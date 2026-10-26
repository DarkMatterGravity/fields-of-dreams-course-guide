/* Shared illustration adjustments; source survey coordinates stay intact. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.CourseDisplay=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function project(p,affine){
  const [[a,b,x],[c,d,y]]=affine;
  const result={x:a*p.x+b*p.y+x+2,y:c*p.x+d*p.y+y+2};
  // Hole 5 long tee QkDw: separate it from hole 4's finishing lines.
  // The same adjustment also moves the coincident route starting vertices.
  if(Math.abs(p.x-559.08)<.01&&Math.abs(p.y-293.52)<.01){result.x-=16;result.y-=3;}
  // Keep the hole 6 orange basket clear of the illustrated riverbank.
  if(Math.abs(p.x-285.92)<.01&&Math.abs(p.y-76.17)<.01){result.y+=22;}
  // Hole 10 long tee: move onto woodland, clear of the short tee and hole 9 basket.
  if(Math.abs(p.x-616.17)<.01&&Math.abs(p.y-94.32)<.01){result.x+=26;result.y+=26;}
  return result;
 }
 function routes(hole,affine,pinIndex){
  const paths=hole.routes.map(r=>({id:r.pathId,orange:pinIndex.get(r.pinId)?.type==='Orange',points:r.vertices.map(v=>project(v.markedPx,affine))}));
  const orangeSegments=paths.filter(r=>r.orange).flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b})));
  const output=new Map();
  for(const route of paths){
   if(route.orange){output.set(route.id,route.points);continue;}
   const samples=[];let length=0;
   for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(len/3));
    for(let j=i===1?0:1;j<=steps;j++)samples.push({x:a.x+dx*j/steps,y:a.y+dy*j/steps,nx:-dy/(len||1),ny:dx/(len||1),along:length+len*j/steps});
    length+=len;
   }
   const matches=samples.map(p=>{
    let nearest=null;
    for(const {a,b}of orangeSegments){
     const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
     if(len<15||Math.abs((-p.ny*dx+p.nx*dy)/(len||1))<.985)continue;
     const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(len*len);
     if(t<0||t>1)continue;
     const q={x:a.x+t*dx,y:a.y+t*dy},distance=Math.hypot(p.x-q.x,p.y-q.y);
     if(distance<4.5&&(!nearest||distance<nearest.distance))nearest={distance,signed:(p.x-q.x)*p.nx+(p.y-q.y)*p.ny};
    }
    return nearest;
   });
   const side=matches.reduce((n,m)=>n+(m?.signed||0),0)>=0?1:-1;
   const offsets=matches.map(m=>m?Math.max(0,Math.min(4.5,4.5-side*m.signed)):0);
   output.set(route.id,samples.map((p,i)=>{
    // Feather the separation into shared endpoints and untouched route sections.
    let sum=0,weight=0;
    for(let j=Math.max(0,i-3);j<=Math.min(samples.length-1,i+3);j++){const w=4-Math.abs(i-j);sum+=offsets[j]*w;weight+=w;}
    const taper=Math.min(1,p.along/12,(length-p.along)/12),offset=sum/weight*Math.max(0,taper)*side;
    return {x:p.x+p.nx*offset,y:p.y+p.ny*offset};
   }));
  }
  return output;
 }
 return {project,routes};
});
