import {fileURLToPath} from 'node:url';
export default {root:'game',resolve:{alias:{three:fileURLToPath(new URL('./game/assets/vendor/three.module.js',import.meta.url))}},server:{host:'0.0.0.0',allowedHosts:['terminal.local']}};
