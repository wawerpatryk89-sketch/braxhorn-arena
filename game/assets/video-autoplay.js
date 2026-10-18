/* Start inline video automatically; retry muted only when audio autoplay is denied. */
(()=>{'use strict';
const waiting=new Set();
window.BRAX_PLAY_VIDEO=async(video,active=()=>true)=>{
 video.playsInline=true;video.setAttribute('playsinline','');
 waiting.delete(video);
 try{await video.play();}
 catch(error){
  if(!active())return;
  if(error.name!=='NotAllowedError')throw error;
  video.muted=true;
  await video.play();
  if(active())waiting.add(video);
 }
 if(!active()){waiting.delete(video);video.pause();}
};
document.addEventListener('click',()=>{
 if(document.querySelector('#titleAudio')?.muted)return;
 for(const video of waiting){waiting.delete(video);if(!video.paused&&!video.ended)video.muted=false;}
},true);
})();
