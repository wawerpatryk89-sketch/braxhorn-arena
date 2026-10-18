(()=>{
'use strict';
const names=Object.freeze({BEAR:'MIŚ',DEMON:'AZRAK'});
// Presentation only: API, saves, asset paths and player nicknames keep their IDs.
window.BRAX_FIGHTER_NAME=id=>Object.prototype.hasOwnProperty.call(names,id)?names[id]:String(id??'');
})();
