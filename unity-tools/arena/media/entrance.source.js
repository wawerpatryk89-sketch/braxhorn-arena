/* Calibrate a straight ground-plane path to the supplied door and source walk.
 * The source animation clock remains in seconds at 1x; no new joint motion.
 * Projected depth is reciprocal distance, not a linear scale animation.
 */
(()=>{'use strict';
window.BRAX_ADVENTURE_ENTRANCE=({config:c,entry:e,width,height,scale})=>{
 const panelWidth=Math.max(width,height*898/512),box=c.entranceBounds||c.union,m=e.mask;
 const edge=()=>{const x0=-Math.max(12,((c.pivotX||512)-box[0])*scale/panelWidth*100+3),distance=(e.xTo-x0)/100*panelWidth/(640/3.25*scale);return{distance,depth:1,x0,yaw:Math.PI/2,masked:false,sample(travel){const u=Math.max(0,Math.min(1,travel/distance));return{x:x0+(e.xTo-x0)*u,ground:.84,depth:1,yaw:Math.PI/2};}};};
 if(!m||e.fromEdge)return edge();
 const doorwayX=m?(m.x+m.w/2)*100:e.xFrom;
 let depth=e.depthFrom;
 if(m&&box){
  const head=(c.anchorY||550)-box[1],halfWidth=Math.max((c.pivotX||512)-box[0],box[2]-(c.pivotX||512));
  depth=Math.min(depth,(e.groundFrom-m.y-.02)*height/(head*scale),(m.w*panelWidth-12)/(2*halfWidth*scale));
 }
 if(!(depth>0&&depth<1))return edge();
 const dx=(e.xTo-doorwayX)/100*panelWidth,unit=640/3.25*scale;
 // With the door as the projection origin, the final lateral distance and
 // authored facing direction determine the world-space length of this path.
 const lateral=dx/unit,outwardDistance=lateral/Math.sin(e.yawFrom);
 if(!(Number.isFinite(outwardDistance)&&outwardDistance>0&&c.prefightRootSamples?.at(-1)?.[1]>0))return edge();
 // Begin fully behind the left jamb. The existing foreground wall reveals the
 // runner as it enters the opening; opacity never substitutes for occlusion.
 const halfWidth=Math.max((c.pivotX||512)-box[0],box[2]-(c.pivotX||512));
 const x0=m.x*100-halfWidth*scale*depth/panelWidth*100-.5;
 const approachDistance=(doorwayX-x0)/100*panelWidth/(unit*depth),distance=approachDistance+outwardDistance;
 return {distance,depth,x0,doorwayX,approachDistance,outwardDistance,yaw:e.yawFrom,masked:true,sample(travel){
  const s=Math.max(0,Math.min(distance,travel)),turn=Math.max(0,Math.min(1,(s-approachDistance+.4)/.8)),yaw=Math.PI/2+(e.yawFrom-Math.PI/2)*turn*turn*(3-2*turn);
  if(s<=approachDistance)return{x:x0+s*unit*depth/panelWidth*100,ground:e.groundFrom,depth,yaw};
  const u=(s-approachDistance)/outwardDistance,d=depth/(1-u*(1-depth)),projected=u*d;
  return{x:doorwayX+(e.xTo-doorwayX)*projected,ground:e.groundFrom+(.84-e.groundFrom)*projected,depth:d,yaw};
 }};
};
})();
