/* Fullscreen is requested synchronously from the completed single tap. */
(()=>{
 'use strict';
 const game=document.querySelector('#game'),status=document.querySelector('#fullscreenStatus');
 const pointers=new Set();let down=null,pending=false;
 const interactive=el=>!!el.closest('button,a,input,select,textarea,[role="button"]');
 function message(){status.hidden=true;}
 function enter(){const root=document.documentElement;if(document.fullscreenElement||document.webkitFullscreenElement||navigator.standalone||window.matchMedia?.('(display-mode: standalone)').matches)return;if(pending)return;const request=root.requestFullscreen||root.webkitRequestFullscreen;if(!request){message();return}pending=true;try{Promise.resolve(request.call(root,{navigationUI:'hide'})).then(()=>{status.hidden=true;window.dispatchEvent(new Event('resize'))}).catch(message).finally(()=>pending=false)}catch{pending=false;message()}}
 game.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size!==1||interactive(e.target)||e.button>0){down=null;return}down={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};},true);
 game.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);const p=down;down=null;if(!p||p.id!==e.pointerId||interactive(e.target)){return}const now=performance.now();if(now-p.t>250||Math.hypot(e.clientX-p.x,e.clientY-p.y)>20){return}e.preventDefault();enter();},true);
 game.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null},true);
 window.addEventListener('blur',()=>{pointers.clear();down=null});
})();
