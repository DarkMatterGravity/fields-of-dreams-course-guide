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
 return {project};
});
